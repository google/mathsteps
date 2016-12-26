'use strict';

const clone = require('../util/clone');
const MathChangeTypes = require('../MathChangeTypes');
const Negative = require('../util/Negative');
const NodeCreator = require('../util/NodeCreator');
const NodeStatus = require('../util/NodeStatus');
const NodeType = require('../util/NodeType');

// Simplifies negative signs if possible
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a NodeStatus object
function simplifySigns(fraction) {
  if (!NodeType.isOperator(fraction) || fraction.op !== '/') {
    return NodeStatus.noChange(fraction);
  }
  const oldFraction = clone(fraction);
  let numerator = fraction.args[0];
  let denominator = fraction.args[1];
  // The denominator should never be negative.
  if (Negative.isNegative(denominator)) {
    denominator = Negative.negate(denominator);
    const changeType = Negative.isNegative(numerator) ?
      MathChangeTypes.CANCEL_MINUSES :
      MathChangeTypes.SIMPLIFY_SIGNS;
    numerator = Negative.negate(numerator);
    let newFraction = NodeCreator.operator('/', [numerator, denominator]);
    return NodeStatus.nodeChanged(changeType, oldFraction, newFraction);
  }
  else {
    return NodeStatus.noChange(fraction);
  }
}

module.exports = simplifySigns;
