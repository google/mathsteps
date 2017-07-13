const clone = require('../../util/clone');
const mixedNumber = require('./mixedNumber');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

function convertMixedNumberToImproperFraction(node) {
  if (!mixedNumber.isMixedNumber(node)) {
    return Node.Status.noChange(node);
  }

  let newNode = clone(node);

  const wholeNumber = mixedNumber.getWholeNumber(node);
  const numerator = mixedNumber.getNumerator(node);
  const denominator = mixedNumber.getDenominator(node);

  // new numerator is wholeNumber * denominator + numerator
  const newNumerator = wholeNumber * denominator + numerator;

  const newNumeratorNode = Node.Creator.constant(newNumerator);
  const newDenominatorNode = Node.Creator.constant(denominator);

  newNode = Node.Creator.operator(
    '/', [newNumeratorNode, newDenominatorNode])

  return Node.Status.nodeChanged(
    ChangeTypes.CONVERT_MIXED_NUMBER, node, newNode);
}

module.exports = convertMixedNumberToImproperFraction;
