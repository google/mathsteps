const Node = require('../node');

function isPolynomialToConstantPower(node) {
  // For the special case when the node is in the form (x + 2)^2
  // First check if is power node and the exponent is a constant
  // Then check if the base is a polynomial

  if (!(Node.Type.isOperator(node, '^')
        && Node.Type.isParenthesis(node.args[0])
        && Node.Type.isConstant(node.args[1]))) {
    return false;
  }
  const base = node.args[0].content;
  const isPolynomial = base.args.some(Node.PolynomialTerm.isPolynomialTerm);

  return isPolynomial;
}

module.exports = isPolynomialToConstantPower;
