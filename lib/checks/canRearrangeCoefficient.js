const Node = require('../node');

// Returns true if the expression is a multiplication between a constant
// and polynomial without a coefficient.
function canRearrangeCoefficient(node) {
  // implicit multiplication doesn't count as multiplication here, since it
  // represents a single term.
  if (node.op !== '*' || node.implicit) {
    return false;
  }
  if (node.args.length !== 2) {
    return false;
  }
  if (!Node.Type.isConstantOrConstantFraction(node.args[1])) {
    return false;
  }
  if (!Node.PolynomialTerm.isPolynomialTerm(node.args[0])) {
    return false;
  }

  const polyNode = new Node.PolynomialTerm(node.args[0]);
  return !polyNode.hasCoeff();
}

module.exports = canRearrangeCoefficient;
