'use strict';

const clone = require('./clone');
const collectAndCombineLikeTerms = require('./collectAndCombine');
const evaluateArithmetic = require('./evaluateArithmetic');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermOperations = require('./PolynomialTermOperations');

// Distributes through parenthesis.
// e.g. 2(x+3) -> (2*x + 2*3)
// e.g. -(x+5) -> (-x + -5)
// Returns a NodeStatus object.
function distributeDFS(node) {
  let status;
  if (NodeType.isConstant(node) || NodeType.isSymbol(node)) {
    return NodeStatus.noChange(node);
  }
  else if (NodeType.isUnaryMinus(node)) {
    // recurse on the content first, to prioritize changes deeper in the tree
    status = distributeDFS(node.args[0]);
    if (!status.hasChanged()) {
      return distributeUnaryMinus(node);
    }
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    // recurse on the children first, to prioritize changes deeper in the tree
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = distributeDFS(child);
      if (childNodeStatus.hasChanged()) {
        return NodeStatus.childChanged(node, childNodeStatus, i);
      }
    }
    return distributeAndSimplifyOperationNode(node);
  }
  else if (NodeType.isParenthesis(node)) {
    status = distributeDFS(node.content);
  }
  else {
    throw Error('Unsupported node type for distribution: ' + node);
  }

  if (status.hasChanged()) {
    return NodeStatus.childChanged(node, status);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Distributes unary minus into a parenthesis node.
// e.g. -(4*9*x^2) --> (-4 * 9  * x^2)
// e.g. -(x + y - 5) --> (-x + -y + 5)
// Returns a NodeStatus object.
function distributeUnaryMinus(node) {
  if (!NodeType.isUnaryMinus(node)) {
    return NodeStatus.noChange(node);
  }
  const unaryContent = node.args[0];
  if (!NodeType.isParenthesis(unaryContent)) {
    return NodeStatus.noChange(node);
  }
  const content = unaryContent.content;
  if (!NodeType.isOperator(content)) {
    return NodeStatus.noChange(node);
  }
  const newContent = clone(content);
  node.changeGroup = 1;
  // For multiplication and division, we can push the unary minus in to
  // the first argument.
  // e.g. -(2/3) -> (-2/3)    -(4*9*x^2) --> (-4 * 9  * x^2)
  if (content.op === '*' || content.op === '/') {
    newContent.args[0] = Negative.negate(newContent.args[0]);
    newContent.args[0].changeGroup = 1;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE_NEGATIVE_ONE, node, newNode, false);
  }
  else if (content.op === '+') {
    // Now we know `node` is of the form -(x + y + ...).
    // We want to now return (-x + -y + ....)
    // If any term is negative, we make it positive it right away
    // e.g. -(2-4) => -2 + 4
    const newArgs = newContent.args.map(arg => {
      let newArg = Negative.negate(arg);
      newArg.changeGroup = 1;
      return newArg;
    });
    newContent.args = newArgs;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE_NEGATIVE_ONE, node, newNode, false);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Distributes a pair of terms in a multiplication operation, if a pair
// can be distributed. To be distributed, there must be two terms beside
// each other, and at least one of them must be a parenthesis node.
// e.g. 2*(3+x) or (4+x^2+x^3)*(x+3)
// Returns a NodeStatus object with substeps
function distributeAndSimplifyOperationNode(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return NodeStatus.noChange(node);
  }

  // STEP 1: distribute with `distributeTwoNodes`
  // e.g. x*(2+x) -> x*2 + x*x
  // STEP 2: simplifications of each operand in the new sum with `simplify`
  // e.g. x*2 + x*x -> ... -> 2x + x^2
  for (let i = 0; i+1 < node.args.length; i++) {
    if (!isParenthesisOfAddition(node.args[i]) &&
        !isParenthesisOfAddition(node.args[i+1])) {
      continue;
    }

    let newNode = clone(node);
    const substeps = [];
    let status;

    const combinedNode = distributeTwoNodes(newNode.args[i], newNode.args[i+1]);
    node.args[i].changeGroup = 1;
    node.args[i+1].changeGroup = 1;
    combinedNode.changeGroup = 1;

    if (newNode.args.length > 2) {
      newNode.args.splice(i, 2, combinedNode);
      newNode.args[i].changeGroup = 1;
    }
    else {
      newNode = combinedNode;
      newNode.changeGroup = 1;
    }

    status = NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE, node, newNode, false);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // case 1: there were more than two operands in this multiplication
    // e.g. 3*7*(2+x)*(3+x)*(4+x) is a multiplication node with 5 children
    // and the new node will be 3*(14+7x)*(3+x)*(4+x) with 4 children.
    if (NodeType.isOperator(newNode) && newNode.op === '*') {
      const childStatus = simplifyWithParens(newNode.args[i]);
      if (childStatus.hasChanged()) {
        status = NodeStatus.childChanged(newNode, childStatus, i);
        substeps.push(status);
        newNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    }
    // case 2: there were only two operands and we multiplied them together.
    // e.g. 7*(2+x) -> (7*2 + 7*x)
    // Now we can just simplify it.
    else if (NodeType.isParenthesis(newNode)){
      status = simplifyWithParens(newNode);
      if (status.hasChanged()) {
        substeps.push(status);
        newNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    }
    else {
      throw Error('Unsupported node type for distribution: ' + node);
    }

    if (substeps.length === 1) {
      return substeps[0];
    }

    return NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE, node, newNode, false, substeps);
  }
  return NodeStatus.noChange(node);
}

// Distributes two nodes together. At least one node must be parenthesis node
// e.g. 2*(x+3) -> (2*x + 2*3)       (5+x)*x -> 5*x + x*x
// e.g. (5+x)*(x+3) -> (5*x + 5*3 + x*x + x*3)
// Returns a node.
function distributeTwoNodes(firstNode, secondNode) {
  // lists of terms we'll be multiplying together from each node
  let firstArgs, secondArgs;
  if (isParenthesisOfAddition(firstNode)) {
    firstArgs = firstNode.content.args;
  }
  else {
    firstArgs = [firstNode];
  }

  if (isParenthesisOfAddition(secondNode)) {
    secondArgs = secondNode.content.args;
  }
  else {
    secondArgs = [secondNode];
  }
  // the new operands under addition, now products of terms
  let newArgs = [];

  // e.g. (4+x)(x+y+z) will become 4(x+y+z) + x(x+y+z) as an intermediate
  // step.
  if (firstArgs.length > 1 && secondArgs.length > 1) {
    firstArgs.forEach(leftArg => {
      let arg = NodeCreator.operator('*', [leftArg, secondNode]);
      arg.changeGroup = 1;
      newArgs.push(arg);
    });
  }
  else {
    // a list of all pairs of nodes between the two arg lists
    firstArgs.forEach(leftArg => {
      secondArgs.forEach(rightArg => {
        let arg = NodeCreator.operator('*', [leftArg, rightArg]);
        arg.changeGroup = 1;
        newArgs.push(arg);
      });
    });
  }
  return NodeCreator.parenthesis(NodeCreator.operator('+', newArgs));
}

// Simplifies a sum of terms (a result of distribution) that's in parens
// (note that all results of distribution are in parens)
// e.g. 2x*(4 + x) distributes to (2x*4 + 2x*x)
// This is a separate function from simplify to make the flow more readable,
// but this is literally just a wrapper around 'simplify'.
// Returns a NodeStatus object
function simplifyWithParens(node) {
  if (!NodeType.isParenthesis(node)) {
    throw Error('expected ' + node + ' to be a parenthesis node');
  }

  const status = simplify(node.content);
  if (status.hasChanged()) {
    return NodeStatus.childChanged(node, status);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Simplifies a sum of terms that are a result of distribution.
// e.g. (2x+3)*(4x+5) -distribute-> 2x*(4x+5) + 3*(4x+5) <- 2 terms to simplify
// e.g. 2x*(4x+5) --distribute--> 2x*4x + 2x*5 --simplify--> 8x^2 + 10x
// Returns a NodeStatus object.
function simplify(node) {
  const substeps = [];
  const simplifyFunctions = [
    evaluateArithmetic,                             // e.g. 2*9 -> 18
    PolynomialTermOperations.rearrangeCoefficient,  // e.g. x*5 -> 5x
    collectAndCombineLikeTerms,                     // e.g 2x*4x -> 8x^2
    distributeAndSimplifyOperationNode, // e.g. (2+x)(3+x) -> 2*(3+x) recurses
  ];

  let newNode = clone(node);
  for (let i = 0; i < newNode.args.length; i++) {
    for (let j = 0; j < simplifyFunctions.length; j++) {
      const childStatus = simplifyFunctions[j](newNode.args[i]);
      if (childStatus.hasChanged()) {
        const status = NodeStatus.childChanged(newNode, childStatus, i);
        substeps.push(status);
        newNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    }
  }

  // possible in cases like 2(x + y) -> 2x + 2y -> doesn't need simplifying
  if (substeps.length === 0) {
    return NodeStatus.noChange(node);
  }
  else {
    return NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_TERMS, node, newNode, false, substeps);
  }
}

// returns true if `node` is of the type (node + node + ...)
function isParenthesisOfAddition(node) {
  if (!NodeType.isParenthesis(node)) {
    return false;
  }
  const content = node.content;
  return NodeType.isOperator(content) && content.op === '+';
}

module.exports = distributeDFS;
