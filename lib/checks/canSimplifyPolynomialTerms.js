'use strict';

const canAddLikeTermPolynomialNodes = require('./canAddLikeTermPolynomialNodes');
const canMultiplyLikeTermPolynomialNodes = require('./canMultiplyLikeTermPolynomialNodes');
const canRearrangeCoefficient = require('./canRearrangeCoefficient');

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
function canSimplifyPolynomialTerms(node) {
  return (canAddLikeTermPolynomialNodes(node) ||
          canMultiplyLikeTermPolynomialNodes(node) ||
          canRearrangeCoefficient(node));
}

module.exports = canSimplifyPolynomialTerms;
