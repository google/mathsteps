const canAddLikeTermWithCoefficientNodes = require('./canAddLikeTermWithCoefficientNodes');

const Node = require('../node');

// Returns true if the nodes are nth roots that can be added together
function canAddLikeTermNthRootNodes(node) {
  return canAddLikeTermWithCoefficientNodes(node, Node.NthRootTerm);
}

module.exports = canAddLikeTermNthRootNodes;
