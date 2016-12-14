'use strict';

const clone = require('./clone');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');

// Note: division is represented in mathjs as an operator node with op '/'
// and two args, where arg[0] is the numerator and arg[1] is the denominator

// This module manipulates fractions.

const Fraction = {};

// Simplifies negative signs if possible
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a NodeStatus object
Fraction.simplifySigns = function(fraction) {
  if (!NodeType.isOperator(fraction) || fraction.op !== '/') {
    return NodeStatus.noChange(fraction);
  }
  const oldFraction = clone(fraction);
  let numerator = fraction.args[0];
  let denominator = fraction.args[1];
  // The denominator should never be negative.
  if (Negative.isNegative(denominator)) {
    denominator = Negative.negate(denominator);
    const changeType = Negative.isNegative(numerator) ?
      MathChangeTypes.CANCEL_MINUSES :
      MathChangeTypes.SIMPLIFY_SIGNS;
    numerator = Negative.negate(numerator);
    let newFraction = NodeCreator.operator('/', [numerator, denominator]);
    return NodeStatus.nodeChanged(changeType, oldFraction, newFraction);
  }
  else {
    return NodeStatus.noChange(fraction);
  }
};

// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a DFS of its own.
// Returns a NodeStatus object
Fraction.breakUpNumeratorDFS = function(node) {
  return functionOperationDFS(node, breakUpNumerator);
};

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// TODO: add a step somewhere to remove common terms in numerator and
// denominator (so the 5s would cancel out on the next step after this)
// This step must happen after things have been distributed, or else the answer
// will be formatted badly, so it's a DFS of its own.
// Returns a NodeStatus object.
Fraction.multiplyFractionsDFS = function(node) {
  return functionOperationDFS(node, multiplyFractions);
};

// A helper function for performing a DFS with a function on fraction nodes
function functionOperationDFS(node, func) {
  let status;

  if (NodeType.isConstant(node) || NodeType.isSymbol(node)) {
    return NodeStatus.noChange(node);
  }
  else if (NodeType.isUnaryMinus(node)) {
    // recurse on the content first, to prioritize changes deeper in the tree
    status = functionOperationDFS(node.args[0], func);
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    // recurse on the children first, to prioritize changes deeper in the tree
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = functionOperationDFS(child, func);
      if (childNodeStatus.hasChanged()) {
        return  NodeStatus.childChanged(node, childNodeStatus, i);
      }
    }
    if (NodeType.isOperator(node)) {
      return func(node);
    }
    else {
      return NodeStatus.noChange(node);
    }
  }
  else if (NodeType.isParenthesis(node)) {
    status = functionOperationDFS(node.content, func);
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }

  if (status.hasChanged()) {
    return NodeStatus.childChanged(node, status);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// Returns a NodeStatus object.
function multiplyFractions(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const atLeastOneFraction = node.args.some(
    arg => NodeType.isOperator(arg) && arg.op === '/');
  const hasPolynomialTerms = node.args.some(
    arg => PolynomialTermNode.isPolynomialTerm(arg));
  if (!atLeastOneFraction || hasPolynomialTerms) {
    return NodeStatus.noChange(node);
  }

  let numeratorArgs = [];
  let denominatorArgs = [];
  node.args.forEach(operand => {
    if (NodeType.isOperator(operand) && operand.op === '/') {
      numeratorArgs.push(operand.args[0]);
      denominatorArgs.push(operand.args[1]);
    }
    else {
      numeratorArgs.push(operand);
    }
  });

  const newNumerator = NodeCreator.parenthesis(
    NodeCreator.operator('*', numeratorArgs));
  const newDenominator = denominatorArgs.length === 1
    ? denominatorArgs[0]
    : NodeCreator.parenthesis(NodeCreator.operator('*', denominatorArgs));

  const newNode = NodeCreator.operator('/', [newNumerator, newDenominator]);
  return NodeStatus.nodeChanged(
    MathChangeTypes.MULTIPLY_FRACTIONS, node, newNode);
}

// If `node` is a fraction with a numerator that is a sum, breaks up the
// fraction e.g. (2+x)/5 -> (2/5 + x/5)
// Returns a NodeStatus object
function breakUpNumerator(node) {
  if (node.op !== '/') {
    return NodeStatus.noChange(node);
  }
  let numerator = node.args[0];
  if (NodeType.isParenthesis(numerator)) {
    numerator = numerator.content;
  }
  if (!NodeType.isOperator(numerator) || numerator.op !== '+') {
    return NodeStatus.noChange(node);
  }

  // At this point, we know that node is a fraction and its numerator is a sum
  // of terms that can't be collected or combined, so we should break it up.
  let fractionList = [];
  const denominator = node.args[1];
  numerator.args.forEach(arg => {
    let newFraction = NodeCreator.operator('/', [arg, denominator]);
    newFraction.changeGroup = 1;
    fractionList.push(newFraction);
  });

  let newNode = NodeCreator.operator('+', fractionList);
  // Wrap in parens for cases like 2*(2+3)/5 => 2*(2/5 + 3/5)
  newNode = NodeCreator.parenthesis(newNode);
  node.changeGroup = 1;
  return NodeStatus.nodeChanged(
    MathChangeTypes.BREAK_UP_FRACTION, node, newNode, false);
}

module.exports = Fraction;
