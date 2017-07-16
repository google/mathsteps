const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// Converts a mixed number to an improper fraction
// e.g. 1 2/3 -> 5/3
// All comments in the function are based on this example
function convertMixedNumberToImproperFraction(node) {
  if (!Node.MixedNumber.isMixedNumber(node)) {
    return Node.Status.noChange(node);
  }

  const substeps = [];
  let newNode = clone(node);

  // e.g. 1 2/3
  const wholeNumber = Node.MixedNumber.getWholeNumberValue(node); // 1
  const numerator = Node.MixedNumber.getNumeratorValue(node); // 2
  const denominator = Node.MixedNumber.getDenominatorValue(node); // 3
  const isNegativeMixedNumber = Node.MixedNumber.isNegativeMixedNumber(node);

  // STEP 1: Convert to unsimplified improper fraction
  // e.g. 1 2/3 -> ((1 * 3) + 2) / 3
  let status = convertToUnsimplifiedImproperFraction(
    newNode, wholeNumber, numerator, denominator, isNegativeMixedNumber);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // STEP 2: Simplify multiplication in numerator
  // e.g. ((1 * 3) + 2) / 3 -> (3 + 2) / 3
  status = simplifyMultiplicationInImproperFraction(
    newNode, wholeNumber, numerator, denominator, isNegativeMixedNumber);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // STEP 3: Simplify addition in numerator
  // e.g. (3 + 2) / 3 -> 5/3
  status = simplifyAdditionInImproperFraction(
    newNode, wholeNumber, numerator, denominator, isNegativeMixedNumber);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  return Node.Status.nodeChanged(
    ChangeTypes.CONVERT_MIXED_NUMBER_TO_IMPROPER_FRACTION,
    node, newNode, true, substeps);
}

// Convert a mixed number to an unsimplified proper fraction
// e.g. 1 2/3 -> ((1 * 3) + 2) / 3
function convertToUnsimplifiedImproperFraction(
  oldNode, wholeNumber, numerator, denominator, isNegativeMixedNumber) {
  // (wholeNumber * denominator)
  // e.g. (1 * 3)
  const newNumeratorMultiplication = Node.Creator.parenthesis(
    Node.Creator.operator(
      '*',
      [Node.Creator.constant(wholeNumber),
        Node.Creator.constant(denominator)]));

  // (wholeNumber * denominator) + numerator
  // e.g. (1 * 3) + 2
  const newNumerator = Node.Creator.operator(
    '+',
    [newNumeratorMultiplication, Node.Creator.constant(numerator)]);
  oldNode.args[0].args[0].changeGroup = 1;
  newNumerator.changeGroup = 1;

  // e.g. 3
  const newDenominator = Node.Creator.constant(denominator);

  let newNode = Node.Creator.operator(
    '/', [newNumerator, newDenominator]);

  if (isNegativeMixedNumber) {
    newNode = Node.Creator.unaryMinus(newNode);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.IMPROPER_FRACTION_NUMERATOR, oldNode, newNode, false);
}

// Simplify multiplication in the numerator of an improper fraction
// e.g. ((1 * 3) + 2) / 3 -> (3 + 2) / 3
function simplifyMultiplicationInImproperFraction(
  oldNode, wholeNumber, numerator, denominator, isNegativeMixedNumber) {
  // (wholeNumber * denominator) + numerator
  // e.g. 3 + 2
  const newNumerator = Node.Creator.operator(
    '+',
    [Node.Creator.constant(wholeNumber * denominator),
      Node.Creator.constant(numerator)]);
  oldNode.args[0].changeGroup = 1;
  newNumerator.changeGroup = 1;

  // e.g. 3
  const newDenominator = Node.Creator.constant(denominator);

  let newNode = Node.Creator.operator(
    '/', [newNumerator, newDenominator]);

  if (isNegativeMixedNumber) {
    newNode = Node.Creator.unaryMinus(newNode);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode, false);
}

// Simplify addition in the numerator of an improper fraction
// e.g. (3 + 2) / 3 -> 5/3
function simplifyAdditionInImproperFraction(
  oldNode, wholeNumber, numerator, denominator, isNegativeMixedNumber) {
  // (wholeNumber * denominator) + numerator
  // e.g. 5
  const newNumerator = Node.Creator.constant(
    wholeNumber * denominator + numerator);
  oldNode.args[0].changeGroup = 1;
  newNumerator.changeGroup = 1;

  // e.g. 3
  const newDenominator = Node.Creator.constant(denominator);

  let newNode = Node.Creator.operator(
    '/', [newNumerator, newDenominator]);

  if (isNegativeMixedNumber) {
    newNode = Node.Creator.unaryMinus(newNode);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode, false);
}

module.exports = convertMixedNumberToImproperFraction;
