const ConstantOrPowerTerm = require('../simplifyExpression/collectAndCombineSearch/ConstantOrConstantPower');
const Node = require('../node');

// Returns true if node is a multiplication of constant power nodes
// where you can combine their exponents, e.g. 10^2 * 10^4 * 10 can become 10^7.
// The node can either be on form c^n or c, as long as c is the same for all.
function canMultiplyLikeTermConstantNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => ConstantOrPowerTerm.isConstantOrConstantPower(n))) {
    return false;
  }
  const constantTermList = node.args.map(n => ConstantOrPowerTerm.getBaseNode(n));
  const firstTerm = constantTermList[0];
  const restTerms = constantTermList.slice(1);
  // they're considered like terms if they have the same base value
  return restTerms.every(term => firstTerm.value === term.value);
}

module.exports = canMultiplyLikeTermConstantNodes;
