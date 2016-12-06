'use strict';

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

// Searches through the tree, prioritizing deeper nodes, and evaluates
// arithmetic (e.g. 2+2 or 3*5*2) on an operation node if possible.
// Returns a NodeStatus object.
function evaluateArithmeticDFS(node) {
  // First recurse on deeper nodes in the tree.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = evaluateArithmeticDFS(node.content);
    if (innerNodeStatus.hasChanged()) {
      return NodeStatus.childChanged(node, innerNodeStatus);
    }
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = evaluateArithmeticDFS(node.args[0]);
    if (innerNodeStatus.hasChanged()) {
      return NodeStatus.childChanged(node, innerNodeStatus);
    }
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = evaluateArithmeticDFS(node.args[i]);
      if (innerNodeStatus.hasChanged()) {
        return NodeStatus.childChanged(node, innerNodeStatus, i);
      }
    }
  }
  else if (NodeType.isSymbol(node) || NodeType.isConstant(node)) {
    // we can't simplify any further
    return NodeStatus.noChange(node);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }

  // If no children changed, try evaluating at this level
  return evaluateArithmetic(node);
}

// evaluates arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
// Returns a NodeStatus object.
function evaluateArithmetic(node) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }
  if (!node.args.every(child => NodeType.isConstant(child, true))) {
    return NodeStatus.noChange(node);
  }

  // we want to eval each arg so unary minuses around constant nodes become
  // constant nodes with negative values
  node.args.forEach((arg, i) => {
    node.args[i] = NodeCreator.constant(arg.eval());
  });

  // Only resolve division of integers if we get an integer result.
  // Note that a fraction of decimals will be divided out.
  if (NodeType.isIntegerFraction(node)) {
    const numeratorValue = parseInt(node.args[0]);
    const denominatorValue = parseInt(node.args[1]);
    if (numeratorValue % denominatorValue === 0) {
      const oldNode = node;
      const newNode = NodeCreator.constant(numeratorValue/denominatorValue);
      return NodeStatus.nodeChanged(
        MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
    }
    else {
      return NodeStatus.noChange(node);
    }
  }
  else {
    const evaluatedValue = evaluateAndRound(node);
    const oldNode = node;
    const newNode = NodeCreator.constant(evaluatedValue);
    return NodeStatus.nodeChanged(MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
}

// Evaluates a math expression to a constant, e.g. 3+4 -> 7 and rounds if
// necessary
function evaluateAndRound(node) {
  let result = node.eval();
  if (result < 1) {
    result  = parseFloat(result.toPrecision(4));
  }
  else {
    result  = parseFloat(result.toFixed(4));
  }
  return result;
}

module.exports = evaluateArithmeticDFS;
