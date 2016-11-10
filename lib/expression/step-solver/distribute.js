'use strict'

const clone = require('./clone');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');
const PolynomialTermOperations = require('./PolynomialTermOperations');

// Distributes through parenthesis.
// e.g. 2(x+3) -> (2*x + 2*3)
// e.g. -(x+5) -> (-x + -5)
// Returns a NodeStatus object.
function distributeDFS(node) {
  if (NodeType.isConstant(node) || NodeType.isSymbol(node)) {
    return NodeStatus.noChange(node);
  }
  else if (NodeType.isUnaryMinus(node)) {
    // recurse on the content first, to prioritize changes deeper in the tree
    const status = distributeDFS(node.args[0]);
    if (status.hasChanged()) {
      return NodeStatus.childChanged(node, status);
    }
    else {
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
    return distributeOperation(node);
  }
  else if (NodeType.isParenthesis(node)) {
    const contentNodeStatus = distributeDFS(node.content);
    return NodeStatus.childChanged(node, contentNodeStatus);
  }
  else {
    throw Error('Unsupported node type for distribution: ' + node);
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
  const content = unaryContent.content
  if (!NodeType.isOperator(content)) {
    return NodeStatus.noChange(node);
  }
  const newContent = clone(content);
  const oldNode = node;
  oldNode.changeBlock = 1;
  // For multiplication and division, we can push the unary minus in to
  // the first argument.
  // e.g. -(2/3) -> (-2/3)    -(4*9*x^2) --> (-4 * 9  * x^2)
  if (content.op === '*' || content.op === '/') {
    newContent.args[0] = Negative.negate(newContent.args[0]);
    newContent.args[0].changeBlock = 1;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE_NEG_ONE, oldNode, newNode);
  }
  else if (content.op === '+') {
    // Now we know `node` is of the form -(x + y + ...).
    // We want to now return (-x + -y + ....)
    const newArgs = newContent.args.map(arg => {
      let newArg = Negative.negate(arg);
      newArg.changeBlock = 1;
      return newArg;
    });
    newContent.args = newArgs;
    const newNode = NodeCreator.parenthesis(newContent);
    return NodeStatus.nodeChanged(
      MathChangeTypes.DISTRIBUTE_NEG_ONE, oldNode, newNode);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Distributes a pair of terms in a multiplication operation, if a pair
// can be distributed. To be distributed, there must be two terms beside
// each other, and at least one of them must be a parenthesis node.
// e.g. 2*(3+x) or (4+x^2+x^3)*(x+3)
// Returns a NodeStatus object.
function distributeOperation(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const oldNode = node;
  for (let i = 0; i+1 < oldNode.args.length; i++) {
    const firstArg = oldNode.args[i];
    const secondArg = oldNode.args[i+1];
    if (isParenthesisOfAddition(firstArg) ||
        isParenthesisOfAddition(secondArg)) {
      const combinedNode = distributeTwoNodes(
        clone(firstArg), clone(secondArg));
      firstArg.changeBlock = 1;
      secondArg.changeBlock = 1; // TODO we might want to consider making this a different colour
      let newNode = clone(oldNode);
      if (newNode.args.length > 2) {
        let newArgs = newNode.args;
        // remove the two args that were combined and replace with the new arg
        newArgs.splice(i, 2, combinedNode);
        newNode.args = newArgs;
      }
      else {
        newNode = combinedNode;
      }
      return NodeStatus.nodeChanged(MathChangeTypes.DISTRIBUTE, oldNode, newNode);
    }
  }
  return NodeStatus.noChange(node);
}

// Distributes two nodes together. At least one node must be parenthesis node
// e.g. 2*(x+3) -> (2*x + 2*3)       (5+x)*x -> 5*x + x*x
// e.g. (5+x)*(x+3) -> (5*x + 5*3 + x*x + x*3)
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
      let arg = NodeCreator.operator('*', [clone(leftArg), clone(secondNode)]);
      arg.changeBlock = 1;
      newArgs.push(arg);
    });
  }
  else {
    // a list of all pairs of nodes between the two arg lists
    firstArgs.forEach(leftArg => {
      secondArgs.forEach(rightArg => {
        let arg = NodeCreator.operator('*', [clone(leftArg), clone(rightArg)]);
        arg.changeBlock = 1;
        newArgs.push(arg);
      });
    });
  }
  return NodeCreator.parenthesis(NodeCreator.operator('+', newArgs));
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
