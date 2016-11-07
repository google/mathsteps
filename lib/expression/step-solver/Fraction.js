'use strict'

const math = require('../../../index');

const ConstantFraction = require('./ConstantFraction');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');

// Note: division is represented in mathjs as an operator node with op '/'
// and two args, where arg[0] is the numerator and arg[1] is the denominator

// This module manipulates fractions.

class Fraction {};


// Simplifies a fraction with common factors, if possible.
// e.g. 2/4 --> 1/2    10/5 --> 2x
// Also simplified negative signs
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a NodeStatus object
Fraction.simplifyFraction = function(fraction) {
  if (!NodeType.isOperator(fraction) || fraction.op !== '/') {
    return new NodeStatus(fraction);
  }
  if (NodeType.isIntegerFraction(fraction)) {
    return ConstantFraction.simplifyFraction(fraction);
  }
  // If it's not an integer fraction, all we can do is simplify signs
  let numerator = fraction.args[0];
  let denominator = fraction.args[1];
  // The denominator should never be negative.
  if (Negative.isNegative(denominator)) {
    denominator = Negative.negate(denominator);
    numerator = Negative.negate(numerator);
    const newFraction = NodeCreator.operator('/', [numerator, denominator]);
    return new NodeStatus(newFraction, true, MathChangeTypes.SIMPLIFY_FRACTION);
  }
  else {
    return new NodeStatus(fraction);
  }
}

// If `node` is a fraction with a denominator that is also a fraction, multiply
// by the inverse.
// e.g. x/(2/3) -> x * 3/2
Fraction.multiplyByInverse = function(node) {
  if (!NodeType.isOperator(node) || node.op !== '/') {
    return new NodeStatus(node);
  }
  let denominator = node.args[1];
  if (NodeType.isParenthesis(denominator)) {
    denominator = denominator.content;
  }
  if (!NodeType.isOperator(denominator) || denominator.op !== '/') {
    return new NodeStatus(node);
  }
  // At this point, we know that node is a fraction and denonimator is the
  // fraction we need to inverse.
  const inverseNumerator = denominator.args[1];
  const inverseDenominator = denominator.args[0];
  const inverseFraction = NodeCreator.operator(
    '/', [inverseNumerator, inverseDenominator]);

  const newNode = NodeCreator.operator('*', [node.args[0], inverseFraction]);
  return new NodeStatus(newNode, true, MathChangeTypes.MULTIPLY_BY_INVERSE);
}

// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a DFS of its own.
// Returns a NodeStatus object
Fraction.breakUpNumeratorDFS = function(node) {
  if (NodeType.isConstant(node) || NodeType.isSymbol(node)) {
    return new NodeStatus(node);
  }
  else if (NodeType.isUnaryMinus(node)) {
    // recurse on the content first, to prioritize changes deeper in the tree
    const status = Fraction.breakUpNumeratorDFS(node.args[0]);
    node.args[0] = status.node;
    return new NodeStatus(node, status.hasChanged, status.changeType);
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    // recurse on the children first, to prioritize changes deeper in the tree
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = Fraction.breakUpNumeratorDFS(child);
      if (childNodeStatus.hasChanged) {
        node.args[i] = childNodeStatus.node;
        return new NodeStatus(node, true, childNodeStatus.changeType);
      }
    }
    if (NodeType.isOperator(node)) {
      return breakUpNumerator(node);
    }
    else {
      return new NodeStatus(node);
    }
  }
  else if (NodeType.isParenthesis(node)) {
    const contentNodeStatus = Fraction.breakUpNumeratorDFS(node.content);
    node.content = contentNodeStatus.node;
    return new NodeStatus(
      node, contentNodeStatus.hasChanged, contentNodeStatus.changeType);
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }
}

// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a DFS of its own.
// Returns a NodeStatus object
Fraction.breakUpNumeratorDFS = function(node) {
  return functionOperationDFS(node, breakUpNumerator);
}

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
}

function functionOperationDFS(node, func) {
  if (NodeType.isConstant(node) || NodeType.isSymbol(node)) {
    return new NodeStatus(node);
  }
  else if (NodeType.isUnaryMinus(node)) {
    // recurse on the content first, to prioritize changes deeper in the tree
    const status = functionOperationDFS(node.args[0], func);
    node.args[0] = status.node;
    return new NodeStatus(node, status.hasChanged, status.changeType);
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    // recurse on the children first, to prioritize changes deeper in the tree
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = functionOperationDFS(child, func);
      if (childNodeStatus.hasChanged) {
        node.args[i] = childNodeStatus.node;
        return new NodeStatus(node, true, childNodeStatus.changeType);
      }
    }
    if (NodeType.isOperator(node)) {
      return func(node);
    }
    else {
      return new NodeStatus(node);
    }
  }
  else if (NodeType.isParenthesis(node)) {
    const contentNodeStatus = functionOperationDFS(node.content, func);
    node.content = contentNodeStatus.node;
    return new NodeStatus(
      node, contentNodeStatus.hasChanged, contentNodeStatus.changeType);
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }
}

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// Returns a NodeStatus object.
function multiplyFractions(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return new NodeStatus(node);
  }
  const atLeastOneFraction = node.args.some(
    arg => NodeType.isOperator(arg) && arg.op === '/');
  const hasPolynomialTerms = node.args.some(
    PolynomialTermNode.isPolynomialTerm);
  if (!atLeastOneFraction || hasPolynomialTerms) {
    return new NodeStatus(node);
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
  return new NodeStatus(newNode, true, MathChangeTypes.MULTIPLY_FRACTIONS);
}

// If `node` is a fraction with a numerator that is a sum, breaks up the
// fraction e.g. (2+x)/5 -> (2/5 + x/5)
// Returns a NodeStatus object
function breakUpNumerator(node) {
  if (node.op !== '/') {
    return new NodeStatus(node);
  }
  let numerator = node.args[0];
  if (NodeType.isParenthesis(numerator)) {
    numerator = numerator.content;
  }
  if (!NodeType.isOperator(numerator) || numerator.op !== '+') {
    return new NodeStatus(node);
  }

  // At this point, we know that node is a fraction and its numerator is a sum
  // of terms that can't be collected or combined, so we should break it up.
  let fractionList = [];
  const denominator = node.args[1];
  numerator.args.forEach(arg => {
    fractionList.push(NodeCreator.operator('/', [arg, denominator]));
  });

  let fractionSum = NodeCreator.operator('+', fractionList);
  // Wrap in parens for cases like 2*(2+3)/5 => 2*(2/5 + 3/5)
  fractionSum = NodeCreator.parenthesis(fractionSum);
  return new NodeStatus(fractionSum, true, MathChangeTypes.BREAK_UP_FRACTION);
}

module.exports = Fraction;
