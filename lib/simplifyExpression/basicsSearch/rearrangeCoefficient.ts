import checks = require('../../checks');
import clone = require('../../util/clone');
import ChangeTypes = require('../../ChangeTypes');
import mathNode = require('../../mathnode');

// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a mathNode.Status object
function rearrangeCoefficient(node: any);
function rearrangeCoefficient(node) {
  if (!checks.canRearrangeCoefficient(node)) {
    return mathNode.Status.noChange(node);
  }

  let newNode = clone(node);

  const polyNode = new mathNode.PolynomialTerm(newNode.args[0]);
  const constNode = newNode.args[1];
  const exponentNode = polyNode.getExponentNode();
  newNode = mathNode.Creator.polynomialTerm(
    polyNode.getSymbolNode(), exponentNode, constNode);

  return mathNode.Status.nodeChanged(
    ChangeTypes.REARRANGE_COEFF, node, newNode);
}

export = rearrangeCoefficient;
