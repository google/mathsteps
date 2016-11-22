'use strict';

const clone = require('clone');
const math = require('mathjs');

const cancelLikeTerms = require('./cancelLikeTerms');
const ConstantFraction = require('./ConstantFraction');
const Fraction = require('./Fraction');
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
  // There are some simplifications that we want to do before recursing,
  // and some after. e.g. 2/2 + 1/2 should be added together instead of
  // recursing on 2/2 and simplifying it together.
  const nodeStatus = simplifyOperationsBeforeRecursion(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }

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

// Both these functions look for a single step to perform on a node (one before
// recursion on its children, one after). If no steps can be taken, returns
// a NO_CHANGE NodeStatus object. Otherwise returns the updated node in a
// NodeStatus object.
function simplifyOperationsBeforeRecursion(node) {
  const simplificationFunctions = [
    ConstantFraction.addConstantFractions,
    ConstantFraction.addConstantAndFraction,
    Fraction.simplifyFraction,
    // e.g. (2x * 5) / 2x -> 5
    cancelLikeTerms,
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

function simplifyOperationsAfterRecursion(node) {
  const simplificationFunctions = [
    // Check if we can perform simple arithmetic on the operands
    // (this has to happen after the fraction stuff or you get infinite loops)
    performArithmetic,
    absoluteValue,

    // POLYNOMIAL TERM simplifications
    PolynomialTermOperations.combinePolynomialTerms,
    // If we have a constant times a polynomial term we can multiply them
    // together e.g. y * 3 -> 3y
    PolynomialTermOperations.multiplyConstantAndPolynomialTerm,
    // Check if we can simplify division in a polynomial term e.g. 2x/4 -> x/2
    PolynomialTermOperations.simplifyPolynomialFraction,
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

// Performs arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
// Returns a NodeStatus object.
function performArithmetic(node) {
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
    const evaluatedValue = manualEval(node);
    const oldNode = node;
    const newNode = NodeCreator.constant(evaluatedValue);
    return NodeStatus.nodeChanged(MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
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

// Evaluates a math expression to a constant, e.g. 3+4 -> 7
// TEMPORARY (hopefully) because apparently operations can only be evaluated
// if they have two arguments?? :(
function manualEval(node) {
  if (NodeType.isParenthesis(node)) {
    node = node.content;
  }
  let result;
  switch (node.op) {
  case '*':
    result = node.args.map(x => parseFloat(x.value)).reduce(
      (prev, curr) => prev * curr);
    break;
  case '+':
    result = node.args.map(x => parseFloat(x.value)).reduce(
      (prev, curr) => prev + curr);
    break;
  // these operations should only be done with two arguments
  default:
    result = node.eval();
  }
  if (result < 1) {
    result  = parseFloat(result.toPrecision(4));
  }
  else {
    result  = parseFloat(result.toFixed(4));
  }
  return result;
}

module.exports = simplifyOperationsDFS;
