'use strict';

const math = require('mathjs');
const clone = require('./clone');
const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

// Note: division is represented in mathjs as an operator node with op '/'
// and two args, where arg[0] is the numerator and arg[1] is the denominator

// This module manipulates fractions with constants in the numerator and
// denominator. For more complex/general fractions, see Fraction.js

const ConstantFraction = {};

// Simplifies a fraction by dividing top and bottom with GCD, if possible.
// e.g. 2/4 --> 1/2    10/5 --> 2x
// Also simplified negative signs
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a NodeStatus object
ConstantFraction.divideByGCD = function(fraction) {
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

// Adds constant fractions -- can start from either step 1 or 2
// 1A. Find the LCD if denominators are different and multiplies to make
//     denominators equal, e.g. 2/3 + 4/6 --> (2*2)/(3*2) + 4/6
// 1B. Multiplies out to make constant fractions again
//     e.g. (2*2)/(3*2) + 4/6 -> 4/6 + 4/6
// 2A. Combines numerators, e.g. 4/6 + 4/6 ->  e.g. 2/5 + 4/5 --> (2+4)/5
// 2B. Adds numerators together, e.g. (2+4)/5 -> 6/5
// Returns a NodeStatus object with substeps
ConstantFraction.addConstantFractions = function(node) {
  let newNode = clone(node);

  if (!NodeType.isOperator(node) || node.op !== '+') {
    return NodeStatus.noChange(node);
  }
  if (!node.args.every(n => NodeType.isIntegerFraction(n, true))) {
    return NodeStatus.noChange(node);
  }
  const denominators = node.args.map(fraction => {
    return parseFloat(fraction.args[1].eval());
  });

  const substeps = [];
  let status;
  // 1A. First create the common denominator if needed
  if (!denominators.every(denominator => denominator === denominators[0])) {
    status = makeCommonDenominator(newNode);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // 1B. Multiply out the denominators
    status = evaluateDenominators(newNode);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // 1B. Multiply out the numerators
    status = evaluateNumerators(newNode);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // 2A. Now that they all have the same denominator, combine the numerators
  status = combineNumeratorsAboveCommonDenominator(newNode);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode); // clone and reset

  // 2B. Finally, add the numerators together
  status = addNumeratorsTogether(newNode);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode); // clone and reset

  // 2C. If the numerator is 0, simplify to just 0
  status = reduceNumerator(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // 2D. If we can simplify the fraction, do so
  status = ConstantFraction.divideByGCD(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  return NodeStatus.nodeChanged(
    MathChangeTypes.ADD_FRACTIONS, node, newNode, true, substeps);
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

  let newNode = clone(node);
  let substeps = [];
  // newConstNode and newFractionNode will end up both constants, or both
  // fractions. I'm naming them based on their original form so we can keep
  // track of which is which.
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
      dividedValue = parseFloat(dividedValue.toPrecision(4));
    }
    else {
      dividedValue = parseFloat(dividedValue.toFixed(4));
    }
    newFractionNode = NodeCreator.constant(dividedValue);
    newConstNode = constNode;
    changeType = MathChangeTypes.DIVIDE_FRACTION_FOR_ADDITION;
  }

  if (NodeType.isConstant(firstArg)) {
    newNode.args[0] = newConstNode;
    newNode.args[1] = newFractionNode;
  }
  else {
    newNode.args[0] = newFractionNode;
    newNode.args[1] = newConstNode;
  }

  substeps.push(NodeStatus.nodeChanged(changeType, node, newNode));
  newNode = NodeStatus.resetChangeGroups(newNode);

  // If we changed an integer to a fraction, we need to add the steps for
  // adding the fractions.
  if (changeType === MathChangeTypes.CONVERT_INTEGER_TO_FRACTION) {
    const addFractionStatus = ConstantFraction.addConstantFractions(newNode);
    substeps = substeps.concat(addFractionStatus.substeps);
  }
  // Otherwise, add the two constants
  else {
    const evalNode = NodeCreator.constant(newNode.eval());
    substeps.push(NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_ARITHMETIC, newNode, evalNode));
  }

  const lastStep = substeps[substeps.length - 1];
  newNode = NodeStatus.resetChangeGroups(lastStep.newNode);

  return NodeStatus.nodeChanged(
    MathChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, substeps);
};

// Given a + operation node with a list of fraction nodes as args that all have
// the same denominator, add them together. e.g. 2/3 + 5/3 -> (2+5)/3
// Returns the new node.
function combineNumeratorsAboveCommonDenominator(node) {
  let newNode = clone(node);

  const commonDenominator = newNode.args[0].args[1];
  let numeratorArgs = [];
  newNode.args.forEach(fraction => {
    numeratorArgs.push(fraction.args[0]);
  });
  const newNumerator = NodeCreator.parenthesis(
    NodeCreator.operator('+', numeratorArgs));

  newNode = NodeCreator.operator('/', [newNumerator, commonDenominator]);
  return NodeStatus.nodeChanged(
    MathChangeTypes.COMBINE_NUMERATORS, node, newNode);
}

// Given a node with a numerator that is an addition node, will add
// all the numerators and return the result
function addNumeratorsTogether(node) {
  let newNode = clone(node);

  newNode.args[0] = NodeCreator.constant(newNode.args[0].eval());
  return NodeStatus.nodeChanged(
    MathChangeTypes.ADD_NUMERATORS, node, newNode);
}

function reduceNumerator(node) {
  let newNode = clone(node);

  if (newNode.args[0].value === '0') {
    newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(
      MathChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }

  return NodeStatus.noChange(node);
}

// Takes `node`, a sum of fractions, and returns a node that's a sum of
// fractions with denominators that evaluate to the same common denominator
// e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
// Returns the new node.
function makeCommonDenominator(node) {
  let newNode = clone(node);

  const denominators = newNode.args.map(fraction => {
    return parseFloat(fraction.args[1].value);
  });
  const commonDenominator = math.lcm(...denominators);

  newNode.args.forEach((child, i) => {
    // missingFactor is what we need to multiply the top and bottom by
    // so that the denominator is the LCD
    const missingFactor = commonDenominator / denominators[i];
    if (missingFactor !== 1) {
      const missingFactorNode = NodeCreator.constant(missingFactor);
      const newNumerator = NodeCreator.parenthesis(
        NodeCreator.operator('*', [child.args[0], missingFactorNode]));
      const newDeominator = NodeCreator.parenthesis(
        NodeCreator.operator('*', [child.args[1], missingFactorNode]));
      newNode.args[i] = NodeCreator.operator('/', [newNumerator, newDeominator]);
    }
  });

  return NodeStatus.nodeChanged(
    MathChangeTypes.COMMON_DENOMINATOR, node, newNode);
}

function evaluateDenominators(node) {
  let newNode = clone(node);

  newNode.args.map(fraction => {
    fraction.args[1] = NodeCreator.constant(fraction.args[1].eval());
  });

  return NodeStatus.nodeChanged(
    MathChangeTypes.MULTIPLY_DENOMINATORS, node, newNode);
}

function evaluateNumerators(node) {
  let newNode = clone(node);

  newNode.args.map(fraction => {
    fraction.args[0] = NodeCreator.constant(fraction.args[0].eval());
  });

  return NodeStatus.nodeChanged(
    MathChangeTypes.MULTIPLY_NUMERATORS, node, newNode);
}

module.exports = ConstantFraction;
