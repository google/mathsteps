const Node = require('../node');
const canAddLikeTermWithCoefficientNodes = require('./canAddLikeTermWithCoefficientNodes');

function canAddLikeTermNthRootNodes(node) {
  return canAddLikeTermWithCoefficientNodes(
    node, Node.NthRootTerm.baseNodeFunc)
}

module.exports = canAddLikeTermNthRootNodes
