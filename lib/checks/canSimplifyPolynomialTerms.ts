import { canAddLikeTermPolynomialNodes } from "./canAddLikeTerms";
import { canMultiplyLikeTermPolynomialNodes } from "./canMultiplyLikeTermPolynomialNodes";
import { canRearrangeCoefficient } from "./canRearrangeCoefficient";

/**
 * Returns true if the node is an operation node with parameters that are
 * polynomial terms that can be combined in some way.
 * */
export function canSimplifyPolynomialTerms(node) {
  return (
    canAddLikeTermPolynomialNodes(node) ||
    canMultiplyLikeTermPolynomialNodes(node) ||
    canRearrangeCoefficient(node)
  );
}
