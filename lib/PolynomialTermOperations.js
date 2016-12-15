'use strict';

// Operations on polynomial term nodes

const clone = require('./clone');
const evaluateArithmetic = require('./evaluateArithmetic');
const evaluateConstantSum = require('./evaluateConstantSum');
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
PolynomialTermOperations.canCombinePolynomialTerms = function(node) {
  return (canAddLikeTermPolynomialNodes(node) ||
          canMultiplyLikeTermPolynomialNodes(node) ||
          canRearrangeCoefficient(node));
};


// Returns true if the nodes are polynomial terms that can be added together.
// TODO: remove from here
function canAddLikeTermPolynomialNodes(node) {
  if (!NodeType.isOperator(node) || node.op !== '+') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => PolynomialTermNode.isPolynomialTerm(n))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const polynomialTermList = args.map(n => new PolynomialTermNode(n));

  // to add terms, they must have the same symbol name *and* exponent
  const firstTerm = polynomialTermList[0];
  const sharedSymbol = firstTerm.getSymbolName();
  const sharedExponentNode = firstTerm.getExponentNode(true);

  const restTerms = polynomialTermList.slice(1);
  return restTerms.every(term => {
    const haveSameSymbol = sharedSymbol === term.getSymbolName();
    const exponentNode = term.getExponentNode(true);
    const haveSameExponent = exponentNode.equals(sharedExponentNode);
    return haveSameSymbol && haveSameExponent;
  });
}

// Returns true if the nodes are symbolic terms with the same symbol
// and no coefficients.
function canMultiplyLikeTermPolynomialNodes(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => PolynomialTermNode.isPolynomialTerm(n))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const polynomialTermList = node.args.map(n => new PolynomialTermNode(n));
  if (!polynomialTermList.every(polyTerm => !polyTerm.hasCoeff())) {
    return false;
  }

  const firstTerm = polynomialTermList[0];
  const restTerms = polynomialTermList.slice(1);
  // they're considered like terms if they have the same symbol name
  return restTerms.every(term => firstTerm.getSymbolName() === term.getSymbolName());
}

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
