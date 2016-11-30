'use strict';

const clone = require('clone');

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
  const newContent = clone(content, false);
  const oldNode = node;
  oldNode.changeGroup = 1;
  // For multiplication and division, we can push the unary minus in to
  // the first argument.
  // e.g. -(2/3) -> (-2/3)    -(4*9*x^2) --> (-4 * 9  * x^2)
  if (content.op === '*' || content.op === '/') {
    newContent.args[0] = Negative.negate(newContent.args[0]);
    newContent.args[0].changeGroup = 1;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE_NEG_ONE, oldNode, newNode, false);
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
      MathChangeTypes.DISTRIBUTE_NEG_ONE, oldNode, newNode, false);
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

  const oldNode = node;

  // STEP 1: distribute with `distributeTwoNodes`
  // e.g. x*(2+x) -> x*2 + x*x
  // STEP 2: simplifications of each operand in the new sum with `simplify`
  // e.g. x*2 + x*x -> ... -> 2x + x^2
  let simplifyStatus;
  let finalNode;

  for (let i = 0; i+1 < oldNode.args.length; i++) {
    const firstArg = oldNode.args[i];
    const secondArg = oldNode.args[i+1];
    if (!isParenthesisOfAddition(firstArg) &&
        !isParenthesisOfAddition(secondArg)) {
      continue;
    }

    const combinedNode = distributeTwoNodes(
      clone(firstArg, false), clone(secondArg, false));
    firstArg.changeGroup = 1;
    secondArg.changeGroup = 1;
    combinedNode.changeGroup = 1;
    let newNode = clone(oldNode, false);
    // case 1: there were more than two operands in this multiplication
    // e.g. 3*7*(2+x)*(3+x)*(4+x) would expand just 7*(2+x)
    // So remove the two args that were combined and replace with the new arg
    // Then simplify that new distribution arg
    if (newNode.args.length > 2) {
      let newArgs = newNode.args;
      newArgs.splice(i, 2, combinedNode);
      newNode.args = newArgs;
      const unsimplifiedNode = NodeStatus.resetChangeGroups(combinedNode);
      const childSimplifyStatus = simplifyWithParens(unsimplifiedNode);
      if (childSimplifyStatus.hasChanged()) {
        simplifyStatus = NodeStatus.childChanged(
          newNode, childSimplifyStatus, i);
      }
      finalNode = simplifyStatus.newNode;
      finalNode.args[i].changeGroup = 1;
    }
    // case 2: there were only two operands and we multiplied them together.
    // e.g. 7*(2+x) -> (7*2 + 7*x)
    // Now we can just simplify it.
    else {
      newNode = combinedNode;
      const unsimplifiedNode = NodeStatus.resetChangeGroups(combinedNode);
      simplifyStatus = simplifyWithParens(unsimplifiedNode);
      finalNode = simplifyStatus.newNode;
      finalNode.changeGroup = 1;
    }

    const distributionStatus = NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE, oldNode, newNode, false);

    if (!simplifyStatus || !simplifyStatus.hasChanged()) {
      return distributionStatus;
    }
    else {
      const substeps = [distributionStatus, simplifyStatus];
      return NodeStatus.nodeChanged(
        MathChangeTypes.DISTRIBUTE, oldNode, finalNode, false, substeps);
    }
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
      let arg = NodeCreator.operator('*', [
        clone(leftArg, false), clone(secondNode, false)]);
      arg.changeGroup = 1;
      newArgs.push(arg);
    });
  }
  else {
    // a list of all pairs of nodes between the two arg lists
    firstArgs.forEach(leftArg => {
      secondArgs.forEach(rightArg => {
        let arg = NodeCreator.operator('*', [
          clone(leftArg, false), clone(rightArg, false)]);
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

  const status = simplify(clone(node.content, false));
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

  const originalNode = node;

  // `oldNode` is always the before in a step's before and after
  let oldNode = clone(node, false);

  for (let i = 0; i < oldNode.args.length; i++) {
    for (let j = 0; j < simplifyFunctions.length; j++) {
      const childStatus = simplifyFunctions[j](oldNode.args[i]);
      if (childStatus.hasChanged()) {
        const status = NodeStatus.childChanged(oldNode, childStatus, i);
        substeps.push(status);
        // this step's newnode is the next step's old node.
        // so clone and reset change groups
        oldNode = NodeStatus.resetChangeGroups(status.newNode);
      }
    }
  }

  // possible in cases like 2(x + y) -> 2x + 2y -> doesn't need simplifying
  if (substeps.length === 0) {
    return NodeStatus.noChange(node);
  }
  else {
    const lastStep = substeps[substeps.length - 1];
    const finalNode = NodeStatus.resetChangeGroups(lastStep.newNode);
    return NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_TERMS, originalNode, finalNode, false, substeps);
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
