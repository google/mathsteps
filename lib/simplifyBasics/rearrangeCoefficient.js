'use strict';

const clone = require('../util/clone');
const MathChangeTypes = require('../MathChangeTypes');
const NodeCreator = require('../util/NodeCreator');
const NodeStatus = require('../util/NodeStatus');
const PolynomialTermNode = require('../PolynomialTermNode');
const PolynomialTermOperations = require('../PolynomialTermOperations');

// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a NodeStatus object
function rearrangeCoefficient(node) {
  if (!PolynomialTermOperations.canRearrangeCoefficient(node)) {
    return NodeStatus.noChange(node);
  }

  let newNode = clone(node);

  const polyNode = new PolynomialTermNode(newNode.args[0]);
  const constNode = newNode.args[1];
  const exponentNode = polyNode.getExponentNode();
  newNode = NodeCreator.polynomialTerm(
    polyNode.getSymbolNode(), exponentNode, constNode);

  return NodeStatus.nodeChanged(
    MathChangeTypes.REARRANGE_COEFF, node, newNode);
}

module.exports = rearrangeCoefficient;
