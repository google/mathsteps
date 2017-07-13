const ConstantOrPowerTerm = require('../simplifyExpression/collectAndCombineSearch/ConstantOrConstantPower');
const Node = require('../node');

// Returns true if node is a division of constant power nodes
// where you can combine their exponents, e.g. 10^4 / 10^2 can become 10^2
// The node can be on the form c^n or c, as long is c is the same for all
function canDivideLikeTermConstantNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '/') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => ConstantOrPowerTerm.isConstantOrConstantPower(n))) {
    return false;
  }

  const constantTermBaseList = args.map(n => ConstantOrPowerTerm.getBaseNode(n));
  const firstTerm = constantTermBaseList[0];
  const restTerms = constantTermBaseList.slice(1);
  // they're considered like terms if they have the same base value
  return restTerms.every(term => firstTerm.value === term.value);
}

module.exports = canDivideLikeTermConstantNodes;

