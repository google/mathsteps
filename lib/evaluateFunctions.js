'use strict';

const clone = require('clone');
const math = require('mathjs');

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

const FUNCTIONS = [
  absoluteValue
];

// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a NodeStatus object.
function evaluateFunctionsDFS(node) {
  // First recurse on deeper nodes in the tree.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = evaluateFunctionsDFS(node.content);
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = evaluateFunctionsDFS(node.args[0]);
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = evaluateFunctionsDFS(node.args[i]);
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

  // If recursing already peformed a step, return with that step.
  // Otherwise try evaluating at this level.
  if (innerNodeStatus.hasChanged()) {
    return NodeStatus.childChanged(node, innerNodeStatus);
  }
  else {
    return evaluateFunctions(node);
  }
}

// Evaluates a function call if possible. Returns a NodeStatus object.
function evaluateFunctions(node) {
  if (!NodeType.isFunction(node)) {
    return NodeStatus.noChange(node);
  }

  for (let i = 0; i < FUNCTIONS.length; i++) {
    let nodeStatus = FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
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
    return NodeStatus.noChange(node);
  }
}

module.exports = evaluateFunctionsDFS;
