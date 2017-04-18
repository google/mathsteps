const Node = require('../node');


// Returns true if the nodes are constant terms with the same constant and has an exponent each

function canMultiplyLikeTermConstantNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*' || node.args[1].op === '/') {
    return false;
  }
  const args = node.args;
  if (args.some(n=> Node.PolynomialTerm.isPolynomialTerm(n))) {
    return false;
  }
  if (!args.every(n => Node.ConstantTerms.isConstantTerm(n))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }
  const constantTermList = node.args.map(n => new Node.ConstantTerms(n));
  const firstTerm = constantTermList[0];
  const restTerms = constantTermList.slice(1);
  // they're considered like terms if they have the same symbol name
  return restTerms.every(term => firstTerm.getBaseValue() === term.getBaseValue());
}

module.exports = canMultiplyLikeTermConstantNodes;
