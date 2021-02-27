import { ChangeTypes } from "../../ChangeTypes";
import { NodeMixedNumber } from "../../node/MixedNumber";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Converts a mixed number to an improper fraction
// e.g. 1 2/3 -> 5/3
// All comments in the function are based on this example
export function convertMixedNumberToImproperFraction(node) {
  if (!NodeMixedNumber.isMixedNumber(node)) {
    return NodeStatus.noChange(node);
  }

  const substeps = [];
  let newNode = node.cloneDeep();

  // e.g. 1 2/3
  const wholeNumber = NodeMixedNumber.getWholeNumberValue(node); // 1
  const numerator = NodeMixedNumber.getNumeratorValue(node); // 2
  const denominator = NodeMixedNumber.getDenominatorValue(node); // 3
  const isNegativeMixedNumber = NodeMixedNumber.isNegativeMixedNumber(node);

  // STEP 1: Convert to unsimplified improper fraction
  // e.g. 1 2/3 -> ((1 * 3) + 2) / 3
  let status = convertToUnsimplifiedImproperFraction(
    newNode,
    wholeNumber,
    numerator,
    denominator,
    isNegativeMixedNumber
  );
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 2: Simplify multiplication in numerator
  // e.g. ((1 * 3) + 2) / 3 -> (3 + 2) / 3
  status = simplifyMultiplicationInImproperFraction(
    newNode,
    wholeNumber,
    numerator,
    denominator,
    isNegativeMixedNumber
  );
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 3: Simplify addition in numerator
  // e.g. (3 + 2) / 3 -> 5/3
  status = simplifyAdditionInImproperFraction(
    newNode,
    wholeNumber,
    numerator,
    denominator,
    isNegativeMixedNumber
  );
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  return NodeStatus.nodeChanged(
    ChangeTypes.CONVERT_MIXED_NUMBER_TO_IMPROPER_FRACTION,
    node,
    newNode,
    true,
    substeps
  );
}

// Convert a mixed number to an unsimplified proper fraction
// e.g. 1 2/3 -> ((1 * 3) + 2) / 3
function convertToUnsimplifiedImproperFraction(
  oldNode,
  wholeNumber,
  numerator,
  denominator,
  isNegativeMixedNumber
) {
  // (wholeNumber * denominator)
  // e.g. (1 * 3)
  const newNumeratorMultiplication = NodeCreator.parenthesis(
    NodeCreator.operator("*", [
      NodeCreator.constant(wholeNumber),
      NodeCreator.constant(denominator),
    ])
  );

  // (wholeNumber * denominator) + numerator
  // e.g. (1 * 3) + 2
  const newNumerator = NodeCreator.operator("+", [
    newNumeratorMultiplication,
    NodeCreator.constant(numerator),
  ]);
  oldNode.args[0].args[0].changeGroup = 1;
  newNumerator.changeGroup = 1;

  // e.g. 3
  const newDenominator = NodeCreator.constant(denominator);

  let newNode = NodeCreator.operator("/", [newNumerator, newDenominator]);

  if (isNegativeMixedNumber) {
    newNode = NodeCreator.unaryMinus(newNode);
  }

  return NodeStatus.nodeChanged(
    ChangeTypes.IMPROPER_FRACTION_NUMERATOR,
    oldNode,
    newNode,
    false
  );
}

// Simplify multiplication in the numerator of an improper fraction
// e.g. ((1 * 3) + 2) / 3 -> (3 + 2) / 3
function simplifyMultiplicationInImproperFraction(
  oldNode,
  wholeNumber,
  numerator,
  denominator,
  isNegativeMixedNumber
) {
  // (wholeNumber * denominator) + numerator
  // e.g. 3 + 2
  const newNumerator = NodeCreator.operator("+", [
    NodeCreator.constant(wholeNumber * denominator),
    NodeCreator.constant(numerator),
  ]);
  oldNode.args[0].changeGroup = 1;
  newNumerator.changeGroup = 1;

  // e.g. 3
  const newDenominator = NodeCreator.constant(denominator);

  let newNode = NodeCreator.operator("/", [newNumerator, newDenominator]);

  if (isNegativeMixedNumber) {
    newNode = NodeCreator.unaryMinus(newNode);
  }

  return NodeStatus.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC,
    oldNode,
    newNode,
    false
  );
}

// Simplify addition in the numerator of an improper fraction
// e.g. (3 + 2) / 3 -> 5/3
function simplifyAdditionInImproperFraction(
  oldNode,
  wholeNumber,
  numerator,
  denominator,
  isNegativeMixedNumber
) {
  // (wholeNumber * denominator) + numerator
  // e.g. 5
  const newNumerator = NodeCreator.constant(
    wholeNumber * denominator + numerator
  );
  oldNode.args[0].changeGroup = 1;
  newNumerator.changeGroup = 1;

  // e.g. 3
  const newDenominator = NodeCreator.constant(denominator);

  let newNode = NodeCreator.operator("/", [newNumerator, newDenominator]);

  if (isNegativeMixedNumber) {
    newNode = NodeCreator.unaryMinus(newNode);
  }

  return NodeStatus.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC,
    oldNode,
    newNode,
    false
  );
}
