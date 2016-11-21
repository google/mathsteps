'use strict';

const clone = require('clone');
const math = require('mathjs');

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

// Note: division is represented in mathjs as an operator node with op '/'
// and two args, where arg[0] is the numerator and arg[1] is the denominator

// This module manipulates fractions with constants in the numerator and
// denominator. For more complex/general fractions, see Fraction.js

const ConstantFraction = {};

// Simplifies a fraction with common factors, if possible.
// e.g. 2/4 --> 1/2    10/5 --> 2x
// Also simplified negative signs
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a NodeStatus object
ConstantFraction.simplifyFraction = function(fraction) {
  if (!NodeType.isOperator(fraction) || fraction.op !== '/') {
    return NodeStatus.noChange(fraction);
  }
  // If it's not an integer fraction, all we can do is simplify signs
  if (!NodeType.isIntegerFraction(fraction, true)) {
    return NodeStatus.noChange(fraction);
  }

  const numeratorValue = parseInt(fraction.args[0].eval());
  const denominatorValue = parseInt(fraction.args[1].eval());

  // The gcd is what we're dividing the numerator and denominator by.
  let gcd = math.gcd(numeratorValue, denominatorValue);
  // A greatest common denominator is technically defined as always positive,
  // but since our goal is to reduce negative signs or move them to the
  // numerator, a negative denominator always means we want to flip signs
  // of both numerator and denominator.
  // e.g. -1/-3 --> 1/3   4/-5 --> -4/5
  if (denominatorValue < 0) {
    gcd *= -1;
  }

  if (gcd === 1) {
    return NodeStatus.noChange(fraction);
  }

  const oldFraction = fraction;

  const newNumeratorNode = NodeCreator.constant(numeratorValue/gcd);
  const newDenominatorNode = NodeCreator.constant(denominatorValue/gcd);
  let newFraction;
  if (parseFloat(newDenominatorNode.value) === 1) {
    newFraction = newNumeratorNode;
  }
  else {
    newFraction = NodeCreator.operator(
      '/', [newNumeratorNode, newDenominatorNode]);
  }

  return NodeStatus.nodeChanged(
    MathChangeTypes.SIMPLIFY_FRACTION, oldFraction, newFraction);
};

// If `node` is a sum of constant fractions, either finds the LCD and sets
// up all the denominators to equal the LCD, or adds the fractions together
// if they all have the same denominator.
// e.g. 2/3 + 4/6 --> (2*2)/(3*2) + 4/6
// e.g. 2/5 + 4/5 --> (2+4)/5
// returns a NodeStatus object.
ConstantFraction.addConstantFractions = function(node) {
  if (!NodeType.isOperator(node) || node.op !== '+') {
    return NodeStatus.noChange(node);
  }
  if (!node.args.every(n => NodeType.isIntegerFraction(n, true))) {
    return NodeStatus.noChange(node);
  }
  const denominators = node.args.map(fraction => {
    return parseFloat(fraction.args[1].eval());
  });

  const oldNode = node;
  // If they all have the same denominator, we can add them together
  if (denominators.every(denominator => denominator === denominators[0])) {
    const newNode = addFractionsWithSameDenominator(node.args);
    return NodeStatus.nodeChanged(
      MathChangeTypes.ADD_FRACTIONS, oldNode, newNode);
  }
  // Otherwise, this step is creating the common denominator
  else {
    const newNode = makeCommonDenominator(node);
    return NodeStatus.nodeChanged(
      MathChangeTypes.COMMON_DENOMINATOR, oldNode, newNode);
  }
};

// Adds a constant to a fraction by:
// - collapsing the fraction to decimal if the constant is not an integer
//   e.g. 5.3 + 1/2 -> 5.3 + 0.2
// - turning the constant into a fraction with the same denominator if it is
//   an integer, e.g. 5 + 1/2 -> 10/2 + 1/2
ConstantFraction.addConstantAndFraction = function(node) {
  if (!NodeType.isOperator(node) || node.op !== '+' || node.args.length !== 2) {
    return NodeStatus.noChange(node);
  }

  const firstArg = node.args[0];
  const secondArg = node.args[1];
  let constNode, fractionNode;
  if (NodeType.isConstant(firstArg)) {
    if (NodeType.isIntegerFraction(secondArg)) {
      constNode = firstArg;
      fractionNode = secondArg;
    }
    else {
      return NodeStatus.noChange(node);
    }
  }
  else if (NodeType.isConstant(secondArg)) {
    if (NodeType.isIntegerFraction(firstArg)) {
      constNode = secondArg;
      fractionNode = firstArg;
    }
    else {
      return NodeStatus.noChange(node);
    }
  }
  else {
    return NodeStatus.noChange(node);
  }

  // These will end up both constants, or both fractions.
  // I'm naming them based on their original form so we can keep track of
  // which is which.
  let oldNode = node;
  let newConstNode, newFractionNode;
  let changeType;
  if (Number.isInteger(parseFloat(constNode.value))) {
    const denominatorNode = fractionNode.args[1];
    const denominatorValue = parseInt(denominatorNode);
    const constNodeValue = parseInt(constNode.value);
    const newNumeratorNode = NodeCreator.constant(
      constNodeValue * denominatorValue);
    newConstNode = NodeCreator.operator(
      '/', [newNumeratorNode, denominatorNode]);
    newFractionNode = fractionNode;
    changeType = MathChangeTypes.CONVERT_INTEGER_TO_FRACTION;
  }
  else {
    // round to 4 decimal places
    let dividedValue = fractionNode.eval();
    if (dividedValue < 1) {
      dividedValue  = parseFloat(dividedValue.toPrecision(4));
    }
    else {
      dividedValue  = parseFloat(dividedValue.toFixed(4));
    }
    newFractionNode = NodeCreator.constant(dividedValue);
    newConstNode = constNode;
    changeType = MathChangeTypes.SIMPLIFY_ARITHMETIC;
  }

  let newNode = clone(node, false);

  if (NodeType.isConstant(firstArg)) {
    newNode.args[0] = newConstNode;
    newNode.args[1] = newFractionNode;
  }
  else {
    newNode.args[0] = newFractionNode;
    newNode.args[1] = newConstNode;
  }
  return NodeStatus.nodeChanged(changeType, oldNode, newNode);
};

// Given a list of nodes `fractionNodes` that all have the same denominator,
// add them together. e.g. 2/3 + 5/3 -> (2+5)/3
// Returns the new node.
function addFractionsWithSameDenominator(fractionNodes) {
  const commonDenominator = fractionNodes[0].args[1];
  let numeratorArgs = [];
  fractionNodes.forEach(fraction => {
    numeratorArgs.push(fraction.args[0]);
  });
  const newNumerator = NodeCreator.parenthesis(
    NodeCreator.operator('+', numeratorArgs));
  return NodeCreator.operator('/', [newNumerator, commonDenominator]);
}

// Takes `node`, a sum of fractions, and returns a node that's a sum of
// fractions with denominators that evaluate to the same common denominator
// e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
// Returns the new node.
function makeCommonDenominator(node) {
  const denominators = node.args.map(fraction => {
    return parseFloat(fraction.args[1].value);
  });
  const commonDenominator = math.lcm(...denominators);

  node.args.forEach((child, i) => {
    // missingFactor is what we need to multiply the top and bottom by
    // so that the denominator is the LCD
    const missingFactor = commonDenominator / denominators[i];
    if (missingFactor !== 1) {
      const missingFactorNode = NodeCreator.constant(missingFactor);
      const newNumerator = NodeCreator.parenthesis(
        NodeCreator.operator('*', [child.args[0], missingFactorNode]));
      const newDeominator = NodeCreator.parenthesis(
        NodeCreator.operator('*', [child.args[1], missingFactorNode]));
      node.args[i] = NodeCreator.operator('/', [newNumerator, newDeominator]);
    }
  });
  return node;
}

module.exports = ConstantFraction;
