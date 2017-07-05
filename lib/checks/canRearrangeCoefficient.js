const clone = require('../util/clone');
const {query} = require('math-nodes');

// Returns true if the expression is a multiplication between a constant
// and polynomial without a coefficient.
function canRearrangeCoefficient(node) {
  // implicit multiplication doesn't count as multiplication here, since it
  // represents a single term.
  if (!query.isMul(node) || node.implicit) {
    return false;
  }
  if (node.args.length !== 2) {
    return false;
  }
  if (!query.isNumber(node.args[1]) && !query.isConstantFraction(node.args[1])) {
    return false;
  }
  if (!query.isPolynomialTerm(node.args[0])) {
    return false;
  }

  const polyNode = clone(node.args[0]);
  return query.getValue(query.getCoefficient(polyNode)) === 1;
}

module.exports = canRearrangeCoefficient;
