'use strict';

// Operations on polynomial term nodes

const clone = require('./util/clone');
const CombineChecks = require('./collectAndCombine/CombineChecks');
const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./util/NodeCreator');
const NodeStatus = require('./util/NodeStatus');
const NodeType = require('./util/NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');

const PolynomialTermOperations = {};

// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a NodeStatus object
PolynomialTermOperations.rearrangeCoefficient = function(node) {
  if (!canRearrangeCoefficient(node)) {
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
};

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
PolynomialTermOperations.canSimplifyPolynomialTerms = function(node) {
  return (CombineChecks.canAddLikeTermPolynomialNodes(node) ||
          CombineChecks.canMultiplyLikeTermPolynomialNodes(node) ||
          canRearrangeCoefficient(node));
};

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
  if (!NodeType.isConstantOrConstantFraction(node.args[1])) {
    return false;
  }
  if (!PolynomialTermNode.isPolynomialTerm(node.args[0])) {
    return false;
  }

  const polyNode = new PolynomialTermNode(node.args[0]);
  return !polyNode.hasCoeff();
}

module.exports = PolynomialTermOperations;
