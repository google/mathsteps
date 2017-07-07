const Node = require('../node');

function canDistribute(node) {
  // For the special case when the node is in the form (x - 2)^2
  // First check if is power node and the exponent is a constant
  // Then check if the base is a polynomial

  const checks = Node.Type.isOperator(node)
        && node.op === '^'
        && Node.Type.isParenthesis(node.args[0])
        && Node.Type.isConstant(node.args[1]);

  if (!checks) {
    return false;
  }
  else {
    const base = node.args[0].content;
    const isPolynomial = base.args.some(Node.PolynomialTerm.isPolynomialTerm);

    return isPolynomial;
  }
}

module.exports = canDistribute;
