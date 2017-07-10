const canAddLikeTermWithCoefficientNodes = require('./canAddLikeTermWithCoefficientNodes');

const Node = require('../node');

function canAddLikeTermNthRootNodes(node) {
  return canAddLikeTermWithCoefficientNodes(
    node, Node.NthRootTerm.baseNodeFunc);
}

module.exports = canAddLikeTermNthRootNodes;
