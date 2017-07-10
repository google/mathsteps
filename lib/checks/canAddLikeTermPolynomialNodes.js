const canAddLikeTermWithCoefficientNodes = require('./canAddLikeTermWithCoefficientNodes');

const Node = require('../node');

function canAddLikeTermPolynomialNodes(node) {
  return canAddLikeTermWithCoefficientNodes(
    node, Node.PolynomialTerm.baseNodeFunc);
}

module.exports = canAddLikeTermPolynomialNodes;
