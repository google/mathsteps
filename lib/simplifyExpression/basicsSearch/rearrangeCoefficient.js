const checks = require('../../checks');
const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a Node.Status object
function rearrangeCoefficient(node) {
  if (!checks.canRearrangeCoefficient(node)) {
    return Node.Status.noChange(node);
  }

  let newNode = clone(node);

  const polyNode = new Node.PolynomialTerm(newNode.args[0]);
  const constNode = newNode.args[1];
  const exponentNode = polyNode.getExponentNode();
  newNode = Node.Creator.polynomialTerm(
    polyNode.getSymbolNode(), exponentNode, constNode);

  return Node.Status.nodeChanged(
    ChangeTypes.REARRANGE_COEFF, node, newNode);
}

module.exports = rearrangeCoefficient;
