import canAddLikeTermPolynomialNodes = require("./canAddLikeTermPolynomialNodes");
import canMultiplyLikeTermPolynomialNodes = require("./canMultiplyLikeTermPolynomialNodes");
import canRearrangeCoefficient = require("./canRearrangeCoefficient");

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
function canSimplifyPolynomialTerms(node: mathjs.MathNode) {
  return (canAddLikeTermPolynomialNodes(node) ||
          canMultiplyLikeTermPolynomialNodes(node) ||
          canRearrangeCoefficient(node));
}

export = canSimplifyPolynomialTerms;
