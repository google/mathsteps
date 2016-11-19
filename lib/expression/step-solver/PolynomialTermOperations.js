'use strict';
// Operations on polynomial term nodes

const ConstantFraction = require('./ConstantFraction');
const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');

class PolynomialTermOperations {}

// Combines polynomial terms for an operation node of type + or *
// Returns a NodeStatus object.
PolynomialTermOperations.combinePolynomialTerms = function(node) {
  let nodeStatus = addlikeTermPolynomialNodes(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }
  nodeStatus = multiplyLikeTermPolynomialNodes(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }
  else {
    return NodeStatus.noChange(node);
  }
};

// Multiplies a constant node by a polynomial node and returns the result
// in a NodeStatus object. If the node's arguments aren't a constant and
// polynomial node, returns a NO_CHANGE NodeStatus object.
PolynomialTermOperations.multiplyConstantAndPolynomialTerm = function(node) {
  if (!canMultiplyConstantAndPolynomial(node)) {
    return NodeStatus.noChange(node);
  }
  const oldNode = node; // TODO: clone to be safe, once we have a clone() to use
  let constNode, polyNode;
  if (NodeType.isConstantOrConstantFraction(node.args[0])) {
    constNode = node.args[0];
    polyNode = new PolynomialTermNode(node.args[1]);
  }
  else {
    constNode = node.args[1];
    polyNode = new PolynomialTermNode(node.args[0]);
  }
  const exponentNode = polyNode.getExponentNode();

  // If it already has a coefficient, make the coefficient a multiplication
  if (polyNode.hasCoeff()) {
    const oldCoeff = polyNode.getCoeffNode();
    const newCoeff = NodeCreator.operator('*', [constNode, oldCoeff]);
    const newNode = NodeCreator.polynomialTerm(
      polyNode.getSymbolNode(), exponentNode, newCoeff);
    return NodeStatus.nodeChanged(MathChangeTypes.MULT_POLY_BY_CONST, oldNode, newNode);
  }
  // If there was no coefficient, the constant becomes the coefficient and
  // this doesn't count as a change.
  else {
    const newNode = NodeCreator.polynomialTerm(
      polyNode.getSymbolNode(), exponentNode, constNode);
    return NodeStatus.noChange(newNode);
  }
};

// Simplifies a polynomial term with a fraction as its coefficients.
// e.g. 2x/4 --> x/2    10x/5 --> 2x
// Also simplified negative signs
// e.g. -y/-3 --> y/3   4x/-5 --> -4x/5
// returns the new simplified node in a NodeStatus object
PolynomialTermOperations.simplifyPolynomialFraction = function(node) {
  if (!PolynomialTermNode.isPolynomialTerm(node)) {
    return NodeStatus.noChange(node);
  }
  const polyNode = new PolynomialTermNode(node);
  if (!polyNode.hasFractionCoeff()) {
    return NodeStatus.noChange(node);
  }

  const coefficientFraction = polyNode.getCoeffNode(); // a division node
  const newCoeffStatus = ConstantFraction.simplifyFraction(coefficientFraction);
  if (!newCoeffStatus.hasChanged()) {
    return NodeStatus.noChange(node);
  }
  else {
    let newCoeff = newCoeffStatus.newNode;
    if (newCoeff.value === '1') {
      newCoeff = null;
    }
    const exponentNode = polyNode.getExponentNode();
    const newNode = NodeCreator.polynomialTerm(
        polyNode.getSymbolNode(), exponentNode, newCoeff);
    const oldNode = node; // TODO: clone this (higher in the function) when we can
    return NodeStatus.nodeChanged(newCoeffStatus.changeType, oldNode, newNode);
  }
};

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
PolynomialTermOperations.canCombinePolynomialTerms = function(node) {
  return (canAddLikeTermPolynomialNodes(node) ||
          canMultiplyLikeTermPolynomialNodes(node) ||
          canMultiplyConstantAndPolynomial(node));
};

// Adds a list of nodes that are polynomial terms. Returns a NodeStatus object.
function addlikeTermPolynomialNodes(node) {
  if (!canAddLikeTermPolynomialNodes(node)) {
    return NodeStatus.noChange(node);
  }
  const polynomialTermList = node.args.map(n => new PolynomialTermNode(n));

  // get a list of the coefficients, to be added
  const coefficientList = polynomialTermList.map(p => p.getCoeffNode(true));
  const sumOfCoefficents = NodeCreator.parenthesis(
    NodeCreator.operator('+', coefficientList));

  // Polynomial terms that can be added together must share the same symbol
  // name and exponent. Get that name and exponent from the first term
  const firstTerm = polynomialTermList[0];
  const exponentNode = firstTerm.getExponentNode();
  const symbolNode = firstTerm.getSymbolNode();

  const newNode = NodeCreator.polynomialTerm(
    symbolNode, exponentNode, sumOfCoefficents);
  const oldNode = node;
  return NodeStatus.nodeChanged(
    MathChangeTypes.ADD_POLYNOMIAL_TERMS, oldNode, newNode);
}

// Multiplies a list of nodes that are polynomial like terms. Returns a node.
// The polynomial nodes should *not* have coefficients. (multiplying
// coefficients is handled in collecting like terms for multiplication)
function multiplyLikeTermPolynomialNodes(node) {
  if (!canMultiplyLikeTermPolynomialNodes(node)) {
    return NodeStatus.noChange(node);
  }
  const polynomialTermList = node.args.map(n => new PolynomialTermNode(n));

  // If we're multiplying polynomial nodes together, they all share the same
  // symbol. Get that from the first node.
  const symbolNode = polynomialTermList[0].getSymbolNode();

  // The new exponent will be a sum of exponents (an operation, wrapped in
  // parens) e.g. x^(3+4+5)
  const exponentNodeList = polynomialTermList.map(p => p.getExponentNode(true));
  const newExponent = NodeCreator.parenthesis(
    NodeCreator.operator('+', exponentNodeList));
  const newNode = NodeCreator.polynomialTerm(symbolNode, newExponent, null);
  const oldNode = node;
  return NodeStatus.nodeChanged(
    MathChangeTypes.MULT_POLYNOMIAL_TERMS, oldNode, newNode);
}

// Returns true if the nodes are polynomial terms that can be added together.
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
function canMultiplyConstantAndPolynomial(node) {
  // implicit multiplication doesn't count as multiplication here, since it
  // represents a single term.
  if (node.op !== '*' || node.implicit) {
    return false;
  }
  if (node.args.length !== 2) {
    return false;
  }
  if (NodeType.isConstantOrConstantFraction(node.args[0])) {
    if (!PolynomialTermNode.isPolynomialTerm(node.args[1])) {
      return false;
    }
    else {
      const polyNode = new PolynomialTermNode(node.args[1]);
      return !polyNode.hasCoeff();
    }
  }
  else if (NodeType.isConstantOrConstantFraction(node.args[1])) {
    if (!PolynomialTermNode.isPolynomialTerm(node.args[0])) {
      return false;
    }
    else {
      const polyNode = new PolynomialTermNode(node.args[0]);
      return !polyNode.hasCoeff();
    }
  }
}

module.exports = PolynomialTermOperations;
