const Node = require('../node');
const NodeType = require('../node/Type');

// Returns true if node is a multiplication of constant power nodes
// where you can combine their exponents, e.g. 10^2 * 10^4 * 10 can become 10^7

function canMultiplyLikeTermConstantNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => isPowerTerm(n))) {
    return false;
  }
  const constantTermList = node.args.map(n => createPowerNode(n));
  const firstTerm = constantTermList[0];
  const restTerms = constantTermList.slice(1);
  // they're considered like terms if they have the same base value
  return restTerms.every(term => getBaseValue(firstTerm) === getBaseValue(term));
}
function createPowerNode(node) {
  if (NodeType.isOperator(node)) {
    if (node.op === '^') {
      const constantNode = node.args[0];
      if (!NodeType.isConstant(constantNode)) {
        throw Error('Expected constant term, got ' + constantNode);
      }
      node.base = constantNode;
      node.exponent = node.args[1];
      return node;
    }
    else {
      throw Error('Expected power sign, got ' + node.op);
    }
  }
  else if (NodeType.isConstant(node)) {
    node.base = node;
    return node;
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }
}

function getBaseValue(node) {
  return node.base.value;
}

function isPowerTerm(node) {
  try {
    // will throw error if node isn't constant power term
    new createPowerNode(node);
    return true;
  }
  catch (err) {
    return false;
  }
}
module.exports = {
  canMultiplyLikeTermConstantNodes,
  createPowerNode
};

