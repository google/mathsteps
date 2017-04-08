const mathNode = require('../node');

// Returns true if the expression is a multiplication between a constant
// and polynomial without a coefficient.
function canRearrangeCoefficient(node: any);
function canRearrangeCoefficient(node) {
  // implicit multiplication doesn't count as multiplication here, since it
  // represents a single term.
  if (node.op !== '*' || node.implicit) {
    return false;
  }
  if (node.args.length !== 2) {
    return false;
  }
  if (!mathNode.Type.isConstantOrConstantFraction(node.args[1])) {
    return false;
  }
  if (!mathNode.PolynomialTerm.isPolynomialTerm(node.args[0])) {
    return false;
  }

  const polyNode = new mathNode.PolynomialTerm(node.args[0]);
  return !polyNode.hasCoeff();
}

export = canRearrangeCoefficient;
