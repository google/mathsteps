const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const Node = require('../../node');

// Simplifies negative signs if possible
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a Node.Status object
function simplifySigns(fraction) {
  if (!Node.Type.isOperator(fraction) || fraction.op !== '/') {
    return Node.Status.noChange(fraction);
  }
  const oldFraction = clone(fraction);
  let numerator = fraction.args[0];
  let denominator = fraction.args[1];
  // The denominator should never be negative.
  if (Negative.isNegative(denominator)) {
    denominator = Negative.negate(denominator);
    const changeType = Negative.isNegative(numerator) ?
      ChangeTypes.CANCEL_MINUSES :
      ChangeTypes.SIMPLIFY_SIGNS;
    numerator = Negative.negate(numerator);
    const newFraction = Node.Creator.operator('/', [numerator, denominator]);
    return Node.Status.nodeChanged(changeType, oldFraction, newFraction);
  }
  else {
    return Node.Status.noChange(fraction);
  }
}

module.exports = simplifySigns;
