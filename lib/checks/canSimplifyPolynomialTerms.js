const canAddLikeTermPolynomialNodes = require('./canAddLikeTermPolynomialNodes');
const canFindDenominatorInNumerator = require('./canFindDenominatorInNumerator');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
function canSimplifyPolynomialTerms(node) {
  return (canAddLikeTermPolynomialNodes(node) ||
          canFindDenominatorInNumerator(node) ||
          canMultiplyLikeTermPolynomialNodes(node) ||
          canRearrangeCoefficient(node));
}

module.exports = canSimplifyPolynomialTerms;
