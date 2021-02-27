import { ChangeTypes } from "../../ChangeTypes";
import { Negative } from "../../Negative";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Simplifies negative signs if possible
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a Status object
export function simplifyFractionSigns(fraction) {
  if (!NodeType.isOperator(fraction) || fraction.op !== "/") {
    return NodeStatus.noChange(fraction);
  }
  const oldFraction = fraction.cloneDeep();
  let numerator = fraction.args[0];
  let denominator = fraction.args[1];
  // The denominator should never be negative.
  if (Negative.isNegative(denominator)) {
    denominator = Negative.negate(denominator);
    const changeType = Negative.isNegative(numerator)
      ? ChangeTypes.CANCEL_MINUSES
      : ChangeTypes.SIMPLIFY_SIGNS;
    numerator = Negative.negate(numerator);
    const newFraction = NodeCreator.operator("/", [numerator, denominator]);
    return NodeStatus.nodeChanged(changeType, oldFraction, newFraction);
  } else {
    return NodeStatus.noChange(fraction);
  }
}
