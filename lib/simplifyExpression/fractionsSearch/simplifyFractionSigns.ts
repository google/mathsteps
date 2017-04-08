import clone = require('../../util/clone');
import ChangeTypes = require('../../ChangeTypes');
import Negative = require('../../Negative');
import mathNode = require('../../mathnode');

// Simplifies negative signs if possible
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a mathNode.Status object
function simplifySigns(fraction: any);
function simplifySigns(fraction) {
  if (!mathNode.Type.isOperator(fraction) || fraction.op !== '/') {
    return mathNode.Status.noChange(fraction);
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
    const newFraction = mathNode.Creator.operator('/', [numerator, denominator]);
    return mathNode.Status.nodeChanged(changeType, oldFraction, newFraction);
  }
  else {
    return mathNode.Status.noChange(fraction);
  }
}

export = simplifySigns;
