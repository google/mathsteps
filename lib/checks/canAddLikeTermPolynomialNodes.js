const Node = require('../node');
const canAddLikeTermWithCoefficientNodes = require('./canAddLikeTermWithCoefficientNodes');


function canAddLikeTermPolynomialNodes(node) {
  return canAddLikeTermWithCoefficientNodes(
    node, Node.PolynomialTerm.baseNodeFunc)
}

module.exports = canAddLikeTermPolynomialNodes
