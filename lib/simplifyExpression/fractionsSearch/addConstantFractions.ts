import clone = require('../../util/clone');
import divideByGCD = require('./divideByGCD');
import math = require('mathjs');
import ChangeTypes = require('../../ChangeTypes');
import evaluate = require('../../util/evaluate');
const mathNode = require('../../node');

// Adds constant fractions -- can start from either step 1 or 2
// 1A. Find the LCD if denominators are different and multiplies to make
//     denominators equal, e.g. 2/3 + 4/6 --> (2*2)/(3*2) + 4/6
// 1B. Multiplies out to make constant fractions again
//     e.g. (2*2)/(3*2) + 4/6 -> 4/6 + 4/6
// 2A. Combines numerators, e.g. 4/6 + 4/6 ->  e.g. 2/5 + 4/5 --> (2+4)/5
// 2B. Adds numerators together, e.g. (2+4)/5 -> 6/5
// Returns a mathNode.Status object with substeps
function addConstantFractions(node: any);
function addConstantFractions(node) {
  let newNode = clone(node);

  if (!mathNode.Type.isOperator(node) || node.op !== '+') {
    return mathNode.Status.noChange(node);
  }
  if (!node.args.every(n => mathNode.Type.isIntegerFraction(n, true))) {
    return mathNode.Status.noChange(node);
  }
  const denominators = node.args.map(fraction => {
    return parseFloat(evaluate(fraction.args[1]));
  });

  const substeps = [];
  let status;

  // 1A. First create the common denominator if needed
  // e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
  if (!denominators.every(denominator => denominator === denominators[0])) {
    status = makeCommonDenominator(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);

    // 1B. Multiply out the denominators
    status = evaluateDenominators(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);

    // 1B. Multiply out the numerators
    status = evaluateNumerators(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
  }

  // 2A. Now that they all have the same denominator, combine the numerators
  // e.g. 2/3 + 5/3 -> (2+5)/3
  status = combineNumeratorsAboveCommonDenominator(newNode);
  substeps.push(status);
  newNode = mathNode.Status.resetChangeGroups(status.newNode);

  // 2B. Finally, add the numerators together
  status = addNumeratorsTogether(newNode);
  substeps.push(status);
  newNode = mathNode.Status.resetChangeGroups(status.newNode);

  // 2C. If the numerator is 0, simplify to just 0
  status = reduceNumerator(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
  }

  // 2D. If we can simplify the fraction, do so
  status = divideByGCD(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
  }

  return mathNode.Status.nodeChanged(
    ChangeTypes.ADD_FRACTIONS, node, newNode, true, substeps);
}

// Given a + operation node with a list of fraction nodes as args that all have
// the same denominator, add them together. e.g. 2/3 + 5/3 -> (2+5)/3
// Returns the new node.
function combineNumeratorsAboveCommonDenominator(node: any);
function combineNumeratorsAboveCommonDenominator(node) {
  let newNode = clone(node);

  const commonDenominator = newNode.args[0].args[1];
  const numeratorArgs = [];
  newNode.args.forEach(fraction => {
    numeratorArgs.push(fraction.args[0]);
  });
  const newNumerator = mathNode.Creator.parenthesis(
    mathNode.Creator.operator('+', numeratorArgs));

  newNode = mathNode.Creator.operator('/', [newNumerator, commonDenominator]);
  return mathNode.Status.nodeChanged(
    ChangeTypes.COMBINE_NUMERATORS, node, newNode);
}

// Given a node with a numerator that is an addition node, will add
// all the numerators and return the result
function addNumeratorsTogether(node: any);
function addNumeratorsTogether(node) {
  const newNode = clone(node);

  newNode.args[0] = mathNode.Creator.constant(evaluate(newNode.args[0]));
  return mathNode.Status.nodeChanged(
    ChangeTypes.ADD_NUMERATORS, node, newNode);
}

function reduceNumerator(node: any);
function reduceNumerator(node) {
  let newNode = clone(node);

  if (newNode.args[0].value === '0') {
    newNode = mathNode.Creator.constant(0);
    return mathNode.Status.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }

  return mathNode.Status.noChange(node);
}

// Takes `node`, a sum of fractions, and returns a node that's a sum of
// fractions with denominators that evaluate to the same common denominator
// e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
// Returns the new node.
function makeCommonDenominator(node: any);
function makeCommonDenominator(node) {
  const newNode = clone(node);

  const denominators = newNode.args.map(fraction => {
    return parseFloat(fraction.args[1].value);
  });
  const commonDenominator = math.lcm(...denominators);

  newNode.args.forEach((child, i) => {
    // missingFactor is what we need to multiply the top and bottom by
    // so that the denominator is the LCD
    const missingFactor = commonDenominator / denominators[i];
    if (missingFactor !== 1) {
      const missingFactorNode = mathNode.Creator.constant(missingFactor);
      const newNumerator = mathNode.Creator.parenthesis(
        mathNode.Creator.operator('*', [child.args[0], missingFactorNode]));
      const newDeominator = mathNode.Creator.parenthesis(
        mathNode.Creator.operator('*', [child.args[1], missingFactorNode]));
      newNode.args[i] = mathNode.Creator.operator('/', [newNumerator, newDeominator]);
    }
  });

  return mathNode.Status.nodeChanged(
    ChangeTypes.COMMON_DENOMINATOR, node, newNode);
}

function evaluateDenominators(node: any);
function evaluateDenominators(node) {
  const newNode = clone(node);

  newNode.args.map(fraction => {
    fraction.args[1] = mathNode.Creator.constant(evaluate(fraction.args[1]));
  });

  return mathNode.Status.nodeChanged(
    ChangeTypes.MULTIPLY_DENOMINATORS, node, newNode);
}

function evaluateNumerators(node: any);
function evaluateNumerators(node) {
  const newNode = clone(node);

  newNode.args.map(fraction => {
    fraction.args[0] = mathNode.Creator.constant(evaluate(fraction.args[0]));
  });

  return mathNode.Status.nodeChanged(
    ChangeTypes.MULTIPLY_NUMERATORS, node, newNode);
}

export = addConstantFractions;
