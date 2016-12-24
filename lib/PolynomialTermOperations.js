'use strict';

// Operations on polynomial term nodes

const CombineChecks = require('./collectAndCombine/CombineChecks');
const NodeType = require('./util/NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');

const PolynomialTermOperations = {};

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
PolynomialTermOperations.canSimplifyPolynomialTerms = function(node) {
  return (CombineChecks.canAddLikeTermPolynomialNodes(node) ||
          CombineChecks.canMultiplyLikeTermPolynomialNodes(node) ||
          PolynomialTermOperations.canRearrangeCoefficient(node));
};

// Returns true if the expression is a multiplication between a constant
// and polynomial without a coefficient.
PolynomialTermOperations.canRearrangeCoefficient = function(node) {
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
};

module.exports = PolynomialTermOperations;
