const canAddLikeTermWithCoefficientNodes = require('./canAddLikeTermWithCoefficientNodes');

const Node = require('../node');

// Returns true if the nodes are polynomial terms that can be added together.
function canAddLikeTermPolynomialNodes(node) {
  return canAddLikeTermWithCoefficientNodes(node, Node.PolynomialTerm);
}

module.exports = canAddLikeTermPolynomialNodes;
