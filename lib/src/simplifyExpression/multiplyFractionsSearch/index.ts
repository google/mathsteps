import { ChangeTypes } from "../../ChangeTypes";
import { TreeSearch } from "../../TreeSearch";
import { NodeType } from "../../node/NodeType";
import { PolynomialTerm } from "../../node/PolynomialTerm";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCustomType } from "../../node/CustomType";
import { NodeCreator } from "../../node/Creator";

// If `node` is a product of terms where:
// 1) at least one is a fraction
// 2) either none are polynomial terms, OR
//    at least one has a symbol in the denominator
// then multiply them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// e.g. 2x * 1/x -> (2x*1) / x
// NOTE: The reason we exclude the case of polynomial terms is because
// we do not want to combine 9/2 * x -> 9x / 2 (which is less readable).
// Cases like 5/2 * x * y/5 will be handled in collect and combine.
// TODO: add a step somewhere to remove common terms in numerator and
// denominator (so the 5s would cancel out on the next step after this)
// This step must happen after things have been distributed, or else the answer
// will be formatted badly, so it's a tree search of its own.
// Returns a Status object.
export const multiplyFractionsSearch = TreeSearch.postOrder(multiplyFractions);

function multiplyFractions(node) {
  if (!NodeType.isOperator(node) || node.op !== "*") {
    return NodeStatus.noChange(node);
  }

  // we need to use the verbose syntax for `some` here because isFraction
  // can take more than one parameter
  const atLeastOneFraction = node.args.some((arg) =>
    NodeCustomType.isFraction(arg)
  );
  const hasPolynomialTerms = node.args.some(PolynomialTerm.isPolynomialTerm);
  const hasPolynomialInDenominatorTerms = node.args.some(
    hasPolynomialInDenominator
  );

  if (
    !atLeastOneFraction ||
    (hasPolynomialTerms && !hasPolynomialInDenominatorTerms)
  ) {
    return NodeStatus.noChange(node);
  }

  const numeratorArgs = [];
  const denominatorArgs = [];
  node.args.forEach((operand) => {
    if (NodeCustomType.isFraction(operand)) {
      const fraction = NodeCustomType.getFraction(operand);
      numeratorArgs.push(fraction.args[0]);
      denominatorArgs.push(fraction.args[1]);
    } else {
      numeratorArgs.push(operand);
    }
  });

  const newNumerator = NodeCreator.parenthesis(
    NodeCreator.operator("*", numeratorArgs)
  );
  const newDenominator =
    denominatorArgs.length === 1
      ? denominatorArgs[0]
      : NodeCreator.parenthesis(NodeCreator.operator("*", denominatorArgs));

  const newNode = NodeCreator.operator("/", [newNumerator, newDenominator]);
  return NodeStatus.nodeChanged(ChangeTypes.MULTIPLY_FRACTIONS, node, newNode);
}

// Returns true if `node` has a polynomial in the denominator,
// e.g. 5/x or 1/2x^2
function hasPolynomialInDenominator(node) {
  if (!NodeCustomType.isFraction(node)) {
    return false;
  }

  const fraction = NodeCustomType.getFraction(node);
  const denominator = fraction.args[1];
  return PolynomialTerm.isPolynomialTerm(denominator);
}
