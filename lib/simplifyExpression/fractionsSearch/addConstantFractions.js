const clone = require('../../util/clone');
const divideByGCD = require('./divideByGCD');
const math = require('mathjs');

const ChangeTypes = require('../../ChangeTypes');
const evaluate = require('../../util/evaluate');
const Node = require('../../node');

// Adds constant fractions -- can start from either step 1 or 2
// 1A. Find the LCD if denominators are different and multiplies to make
//     denominators equal, e.g. 2/3 + 4/6 --> (2*2)/(3*2) + 4/6
// 1B. Multiplies out to make constant fractions again
//     e.g. (2*2)/(3*2) + 4/6 -> 4/6 + 4/6
// 2A. Combines numerators, e.g. 4/6 + 4/6 ->  e.g. 2/5 + 4/5 --> (2+4)/5
// 2B. Adds numerators together, e.g. (2+4)/5 -> 6/5
// Returns a Node.Status object with substeps
function addConstantFractions(node) {
  let newNode = clone(node);

  if (!Node.Type.isOperator(node) || node.op !== '+') {
    return Node.Status.noChange(node);
  }
  if (!node.args.every(n => Node.Type.isIntegerFraction(n, true))) {
    return Node.Status.noChange(node);
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
    newNode = Node.Status.resetChangeGroups(status.newNode);

    // 1B. Multiply out the denominators
    status = evaluateDenominators(newNode);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);

    // 1B. Multiply out the numerators
    status = evaluateNumerators(newNode);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // 2A. Now that they all have the same denominator, combine the numerators
  // e.g. 2/3 + 5/3 -> (2+5)/3
  status = combineNumeratorsAboveCommonDenominator(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // 2B. Finally, add the numerators together
  status = addNumeratorsTogether(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // 2C. If the numerator is 0, simplify to just 0
  status = reduceNumerator(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // 2D. If we can simplify the fraction, do so
  status = divideByGCD(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.ADD_FRACTIONS, node, newNode, true, substeps);
}

// Given a + operation node with a list of fraction nodes as args that all have
// the same denominator, add them together. e.g. 2/3 + 5/3 -> (2+5)/3
// Returns the new node.
function combineNumeratorsAboveCommonDenominator(node) {
  let newNode = clone(node);

  const commonDenominator = newNode.args[0].args[1];
  const numeratorArgs = [];
  newNode.args.forEach(fraction => {
    numeratorArgs.push(fraction.args[0]);
  });
  const newNumerator = Node.Creator.parenthesis(
    Node.Creator.operator('+', numeratorArgs));

  newNode = Node.Creator.operator('/', [newNumerator, commonDenominator]);
  return Node.Status.nodeChanged(
    ChangeTypes.COMBINE_NUMERATORS, node, newNode);
}

// Given a node with a numerator that is an addition node, will add
// all the numerators and return the result
function addNumeratorsTogether(node) {
  const newNode = clone(node);

  newNode.args[0] = Node.Creator.constant(evaluate(newNode.args[0]));
  return Node.Status.nodeChanged(
    ChangeTypes.ADD_NUMERATORS, node, newNode);
}

function reduceNumerator(node) {
  let newNode = clone(node);

  if (newNode.args[0].value === '0') {
    newNode = Node.Creator.constant(0);
    return Node.Status.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Takes `node`, a sum of fractions, and returns a node that's a sum of
// fractions with denominators that evaluate to the same common denominator
// e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
// Returns the new node.
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
      const missingFactorNode = Node.Creator.constant(missingFactor);
      const newNumerator = Node.Creator.parenthesis(
        Node.Creator.operator('*', [child.args[0], missingFactorNode]));
      const newDeominator = Node.Creator.parenthesis(
        Node.Creator.operator('*', [child.args[1], missingFactorNode]));
      newNode.args[i] = Node.Creator.operator('/', [newNumerator, newDeominator]);
    }
  });

  return Node.Status.nodeChanged(
    ChangeTypes.COMMON_DENOMINATOR, node, newNode);
}

function evaluateDenominators(node) {
  const newNode = clone(node);

  newNode.args.map(fraction => {
    fraction.args[1] = Node.Creator.constant(evaluate(fraction.args[1]));
  });

  return Node.Status.nodeChanged(
    ChangeTypes.MULTIPLY_DENOMINATORS, node, newNode);
}

function evaluateNumerators(node) {
  const newNode = clone(node);

  newNode.args.map(fraction => {
    fraction.args[0] = Node.Creator.constant(evaluate(fraction.args[0]));
  });

  return Node.Status.nodeChanged(
    ChangeTypes.MULTIPLY_NUMERATORS, node, newNode);
}

module.exports = addConstantFractions;
