'use strict';

const clone = require('clone');
const math = require('mathjs');

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermOperations = require('./PolynomialTermOperations');

// If we can do a simplify step (e.g. adding two terms, performing some
// arithmetic). Returns a NodeStatus object.
// This function has 3 parts: simplifications for the node before recursing,
// recursion on the child nodes, and simplifications for the node after
// recursion.
function simplifyOperationsDFS(node) {
  // Now recurse on deeper nodes.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = simplifyOperationsDFS(node.content);
    // always update content, since there might be changes that don't count
    // as a step
    node.content = innerNodeStatus.newNode;
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = simplifyOperationsDFS(node.args[0]);
    // always update arg, since there might be changes that don't count
    // as a step
    node.args[0] = innerNodeStatus.newNode;
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = simplifyOperationsDFS(node.args[i]);
      // always update args, since some changes don't count as a step
      node.args[i] = innerNodeStatus.newNode;
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

  // If recursing already performed a step, return with that step.
  // Otherwise try simplifying at this level.
  if (innerNodeStatus.hasChanged()) {
    return NodeStatus.childChanged(node, innerNodeStatus);
  }
  else {
    return simplifyOperationsAfterRecursion(node);
  }
}

function simplifyOperationsAfterRecursion(node) {
  const simplificationFunctions = [
    absoluteValue,

    // POLYNOMIAL TERM simplifications
    PolynomialTermOperations.combinePolynomialTerms,
    // If we have a constant times a polynomial term we can multiply them
    // together e.g. y * 3 -> 3y
    PolynomialTermOperations.multiplyConstantAndPolynomialTerm,
  ];
  for (let i = 0; i < simplificationFunctions.length; i++) {
    let nodeStatus = simplificationFunctions[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    else {
      node = nodeStatus.newNode;
    }
  }

  return NodeStatus.noChange(node);
}

// Evaluates abs() function if it's on a single constant value.
// Returns a NodeStatus object.
function absoluteValue(node) {
  if (!NodeType.isFunction(node, 'abs')) {
    return NodeStatus.noChange(node);
  }
  if (node.args.length > 1) {
    return NodeStatus.noChange(node);
  }
  const oldNode = node;
  let newNode = clone(node, false);
  const argument = newNode.args[0];
  if (NodeType.isConstant(argument, true)) {
    newNode = NodeCreator.constant(math.abs(argument.eval()));
    return NodeStatus.nodeChanged(
      MathChangeTypes.ABSOLUTE_VALUE, oldNode, newNode);
  }
  else if (NodeType.isConstantFraction(argument, true)) {
    const newNumerator = NodeCreator.constant(
      math.abs(argument.args[0].eval()));
    const newDenominator =  NodeCreator.constant(
      math.abs(argument.args[1].eval()));
    newNode = NodeCreator.operator('/', [newNumerator, newDenominator]);
    return NodeStatus.nodeChanged(
      MathChangeTypes.ABSOLUTE_VALUE, oldNode, newNode);
  }
  else {
    throw Error('Absolute value should only have constant arguments: ' + argument);
  }
}

module.exports = simplifyOperationsDFS;
