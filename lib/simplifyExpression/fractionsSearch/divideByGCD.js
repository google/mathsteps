'use strict';

const math = require('mathjs');
const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// Simplifies a fraction (with constant numerator and denominator) by dividing
// the top and bottom by the GCD, if possible.
// e.g. 2/4 --> 1/2    10/5 --> 2x
// Also simplified negative signs
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a Node.Status object
function divideByGCD(fraction) {
  if (!Node.Type.isOperator(fraction) || fraction.op !== '/') {
    return Node.Status.noChange(fraction);
  }
  // If it's not an integer fraction, all we can do is simplify signs
  if (!Node.Type.isIntegerFraction(fraction, true)) {
    return Node.Status.noChange(fraction);
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
    return Node.Status.noChange(fraction);
  }

  const newNumeratorNode = Node.Creator.constant(numeratorValue/gcd);
  const newDenominatorNode = Node.Creator.constant(denominatorValue/gcd);
  let newFraction;
  if (parseFloat(newDenominatorNode.value) === 1) {
    newFraction = newNumeratorNode;
  }
  else {
    newFraction = Node.Creator.operator(
      '/', [newNumeratorNode, newDenominatorNode]);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.SIMPLIFY_FRACTION, fraction, newFraction);
}

module.exports = divideByGCD;
