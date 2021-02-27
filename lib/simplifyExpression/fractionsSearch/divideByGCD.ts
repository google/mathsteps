import * as math from "mathjs";

import { ChangeTypes } from "../../ChangeTypes";
import { evaluate } from "../../util/evaluate";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Simplifies a fraction (with constant numerator and denominator) by dividing
// the top and bottom by the GCD, if possible.
// e.g. 2/4 --> 1/2    10/5 --> 2x
// Also simplified negative signs
// e.g. -1/-3 --> 1/3   4/-5 --> -4/5
// Note that -4/5 doesn't need to be simplified.
// Note that our goal is for the denominator to always be positive. If it
// isn't, we can simplify signs.
// Returns a Status object
export function divideByGCD(fraction) {
  if (!NodeType.isOperator(fraction) || fraction.op !== "/") {
    return NodeStatus.noChange(fraction);
  }
  // If it's not an integer fraction, all we can do is simplify signs
  if (!NodeType.isIntegerFraction(fraction, true)) {
    return NodeStatus.noChange(fraction);
  }

  const substeps = [];
  let newNode = fraction.cloneDeep();

  const numeratorValue = parseInt(evaluate(fraction.args[0]));
  const denominatorValue = parseInt(evaluate(fraction.args[1]));

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

  // STEP 1: Find GCD
  // e.g. 15/6 -> (5*3)/(2*3)
  let status = findGCD(newNode, gcd, numeratorValue, denominatorValue);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 2: Cancel GCD
  // (5*3)/(2*3) -> 5/2
  status = cancelGCD(newNode, gcd, numeratorValue, denominatorValue);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  return NodeStatus.nodeChanged(
    ChangeTypes.SIMPLIFY_FRACTION,
    fraction,
    newNode,
    true,
    substeps
  );
}

// Returns a substep where the GCD is factored out of numerator and denominator
// e.g. 15/6 -> (5*3)/(2*3)
function findGCD(node, gcd, numeratorValue, denominatorValue) {
  let newNode = node.cloneDeep();

  // manually set change group of the GCD nodes to be the same
  const gcdNode = NodeCreator.constant(gcd);
  gcdNode.changeGroup = 1;

  const intermediateNumerator = NodeCreator.parenthesis(
    NodeCreator.operator("*", [
      NodeCreator.constant(numeratorValue / gcd),
      gcdNode,
    ])
  );
  const intermediateDenominator = NodeCreator.parenthesis(
    NodeCreator.operator("*", [
      NodeCreator.constant(denominatorValue / gcd),
      gcdNode,
    ])
  );
  newNode = NodeCreator.operator("/", [
    intermediateNumerator,
    intermediateDenominator,
  ]);

  return NodeStatus.nodeChanged(ChangeTypes.FIND_GCD, node, newNode, false);
}

// Returns a substep where the GCD is cancelled out of numerator and denominator
// e.g. (5*3)/(2*3) -> 5/2
function cancelGCD(node, gcd, numeratorValue, denominatorValue) {
  let newNode;
  const newNumeratorNode = NodeCreator.constant(numeratorValue / gcd);
  const newDenominatorNode = NodeCreator.constant(denominatorValue / gcd);

  if (parseFloat(newDenominatorNode.value) === 1) {
    newNode = newNumeratorNode;
  } else {
    newNode = NodeCreator.operator("/", [newNumeratorNode, newDenominatorNode]);
  }

  return NodeStatus.nodeChanged(ChangeTypes.CANCEL_GCD, node, newNode, false);
}
