const Node = require('../node');
const NodeType = require('../node/Type');

// Returns true if node is a multiplication of constant power nodes
// where you can combine their exponents, e.g. 10^2 * 10^4 * 10 can become 10^7.
// The node can either be on form c^n or c, as long as c is the same for all.
function canMultiplyLikeTermConstantNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => isConstantOrConstantPower(n))) {
    return false;
  }
  const constantTermList = node.map(n => getBaseNode(n));
  const firstTerm = constantTermList.args[0];
  const restTerms = constantTermList.args.slice(1);
  // they're considered like terms if they have the same base value
  return restTerms.every(term => getBaseValue(firstTerm) === getBaseValue(term));
}
// GETTER FUNCTIONS
// Returns the base node if the node is on power form, else returns the node as it is constant.
function getBaseNode(node) {
  if (node.args) {
    return node.args[0];
  }
  else {
    return node;
  }
}
// Returns the value of the base for comparison
function getBaseValue(node) {
  return node.value;
}
// First if returns false so that addOneExponent can take care of the rest, by adding
// one to the exponent if there are none.
function getExponentNode(node) {
  if (node.args === undefined || !node.args[1]) {
    return false;
  }
  else {
    return node.args[1];
  }
}
// Checks if the node is an constant or a power with constant base.
function isConstantOrConstantPower(node) {
  if ((NodeType.isOperator(node, '^') && NodeType.isConstant(node.args[0])) ||
    NodeType.isConstant(node)) {
    return true;
  }
  else {
    return false;
  }
}

module.exports = {
  canMultiplyLikeTermConstantNodes,
  getBaseNode,
  getExponentNode
};