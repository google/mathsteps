const NodeCreator = require('../../node/Creator');
const NodeType = require('../../node/Type');

// This module is needed when simplifying multiplication of constant powers
// as it contains functions to get different parts of the node instead of
// creating a new class, like polynomialTerm. The functions can return the base
// and the exponent of the power, it can also check if the node is constant or
// constant power.
// e.g 2^10 is an constant power, while x^10 is not
// e.g 2 is an constant, while x is not

// Returns the base if the node is on power form
// else returns the node as it is constant.
// e.g 2^4 returns 2
// e.g 3 returns 3, since 3 is equal to 3^1 which has a base of 3
function getBaseNode(node) {
  if (node.args) {
    return node.args[0];
  }
  else {
    return node;
  }
}

// Returns the node that is an exponent to a constant, or a constant node with
// value 1 if there's no exponent.
// e.g. on the node representing 2^3, returns a constant node with value 3
// e.g 3 returns 1, since 3 is equal to 3^1 which has an exponent of 1
function getExponentNode(node) {
  if (NodeType.isConstant(node)) {
    return NodeCreator.constant(1);
  }
  else {
    return node.args[1];
  }
}

// Checks if the node is an constant or a power with constant base.
// e.g. 2^3 is a constant power node, 5 is a constant node, x and x^2 are not
function isConstantOrConstantPower(node) {
  return ((NodeType.isOperator(node, '^') &&
           NodeType.isConstant(node.args[0])) ||
          NodeType.isConstant(node));
}

module.exports = {
  getBaseNode,
  getExponentNode,
  isConstantOrConstantPower
};
