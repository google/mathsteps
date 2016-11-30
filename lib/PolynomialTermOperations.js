'use strict';

// Operations on polynomial term nodes

const clone = require('clone');

const ConstantFraction = require('./ConstantFraction');
const evaluateArithmetic = require('./evaluateArithmetic');
const evaluateConstantSum = require('./evaluateConstantSum');
const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');

const PolynomialTermOperations = {};

// Combines polynomial terms for an operation node of type + or *
// Returns a NodeStatus object.
PolynomialTermOperations.combinePolynomialTerms = function(node) {
  let nodeStatus = PolynomialTermOperations.addLikeTerms(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }
  nodeStatus = PolynomialTermOperations.multiplyLikeTerms(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }
  else {
    return NodeStatus.noChange(node);
  }
};

// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a nodeStatus object
PolynomialTermOperations.rearrangeCoefficient = function(node) {
  if (!canRearrangeCoefficient(node)) {
    return NodeStatus.noChange(node);
  }
  const oldNode = clone(node, false);
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

  const newNode = NodeCreator.polynomialTerm(
    polyNode.getSymbolNode(), exponentNode, constNode);
  return NodeStatus.nodeChanged(
    MathChangeTypes.REARRANGE_COEFF, oldNode, newNode);

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
  const oldNode = clone(node, false);

  const polyNode = new PolynomialTermNode(node);
  if (!polyNode.hasFractionCoeff()) {
    return NodeStatus.noChange(node);
  }

  const coefficientFraction = polyNode.getCoeffNode(); // a division node
  const newCoeffStatus = ConstantFraction.divideByGCD(coefficientFraction);
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
    return NodeStatus.nodeChanged(newCoeffStatus.changeType, oldNode, newNode);
  }
};

// Returns true if the node is an operation node with parameters that are
// polynomial terms that can be combined in some way.
PolynomialTermOperations.canCombinePolynomialTerms = function(node) {
  return (canAddLikeTermPolynomialNodes(node) ||
          canMultiplyLikeTermPolynomialNodes(node) ||
          canRearrangeCoefficient(node));
};

// Adds a list of nodes that are polynomial terms. Returns a NodeStatus object.
PolynomialTermOperations.addLikeTerms = function(node) {
  if (!canAddLikeTermPolynomialNodes(node)) {
    return NodeStatus.noChange(node);
  }

  const subSteps = [];
  const originalNode = node;
  let oldNode = clone(node, false);

  // STEP 1: If any nodes have no coefficient, make it have coefficient 1
  // (this step only happens under certain conditions and later steps might
  // happen even if step 1 does not)
  let status = addPositiveOneCoefficient(oldNode);
  if (status.hasChanged()) {
    subSteps.push(status);
    // this step's newnode is the next step's old node.
    // so clone and reset change groups
    oldNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 2: If any nodes have a unary minus, make it have coefficient -1
  // (this step only happens under certain conditions and later steps might
  // happen even if step 2 does not)
  status = addNegativeOneCoefficient(oldNode);
  if (status.hasChanged()) {
    subSteps.push(status);
    // clone and reset
    oldNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 3: group the coefficients in a sum
  let newNode = groupCoefficientsForAdding(clone(oldNode, false));
  status =  NodeStatus.nodeChanged(
    MathChangeTypes.GROUP_COEFFICIENTS, oldNode, newNode);
  subSteps.push(status);
  // clone and reset
  oldNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 4: evaluate the sum (could include fractions)
  status = evaluateCoefficientSum(oldNode);
  subSteps.push(status);

  const finalNode = NodeStatus.resetChangeGroups(status.newNode);

  return NodeStatus.nodeChanged(
    MathChangeTypes.ADD_POLYNOMIAL_TERMS,
    originalNode, finalNode, true, subSteps);
};

// Multiplies a list of nodes that are polynomial like terms. Returns a node.
// The polynomial nodes should *not* have coefficients. (multiplying
// coefficients is handled in collecting like terms for multiplication)
PolynomialTermOperations.multiplyLikeTerms = function(node) {
  if (!canMultiplyLikeTermPolynomialNodes(node)) {
    return NodeStatus.noChange(node);
  }
  const originalNode = node;

  const subSteps = [];
  let oldNode = clone(node, false);

  // STEP 1: If any term has no exponent, make it have exponent 1
  // e.g. x -> x^1 (this is for pedagogy reasons)
  // (this step only happens under certain conditions and later steps might
  // happen even if step 1 does not)
  let status = addOneExponent(oldNode);
  if (status.hasChanged()) {
    subSteps.push(status);
    // this step's newnode is the next step's old node.
    // so clone and reset change groups
    oldNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 2: collect exponents to a single exponent sum
  // e.g. x^1 * x^3 -> x^(1+3)
  status = collectExponents(oldNode);
  subSteps.push(status);
  // clone and reset
  oldNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 3: add exponents together.
  // NOTE: This might not be a step if the exponents aren't all constants,
  // but this case isn't that common and can be caught in other steps.
  // e.g. x^(2+4+z)
  // TODO: handle fractions, combining and collecting like terms, etc, here
  const exponentSum = oldNode.args[1].content;
  const sumStatus = evaluateArithmetic(exponentSum);
  if (sumStatus.hasChanged()) {
    status = NodeStatus.childChanged(oldNode, sumStatus, 1);
    subSteps.push(status);
  }

  if (subSteps.length === 1) { // possible if only step 2 happens
    return subSteps[0];
  }
  else {
    const finalNode = NodeStatus.resetChangeGroups(status.newNode);

    return NodeStatus.nodeChanged(
      MathChangeTypes.MULT_POLYNOMIAL_TERMS,
      originalNode, finalNode, true, subSteps);
  }
};

// ----- helpers for adding polynomial terms -------

// Given a sum of like polynomial terms, changes any term with no coefficient
// into a term with an explicit coefficient of 1. This is for pedagogy, and
// makes the adding coefficients step clearer.
// e.g. 2x + x -> 2x + 1x
// Returns a NodeStatus object.
function addPositiveOneCoefficient(node) {
  const oldNode = node;
  const newNode = clone(node, false);
  let change = false;

  newNode.args = newNode.args.map(polyNode => {
    const polyTerm = new PolynomialTermNode(polyNode);
    if (polyTerm.getCoeffValue() === 1) {
      change = true;
      polyNode.changeGroup = 1; // note that this is the "oldNode"
      const newTermWithCeoff = NodeCreator.polynomialTerm(
        polyTerm.getSymbolNode(),
        polyTerm.getExponentNode(),
        NodeCreator.constant(1));
      newTermWithCeoff.changeGroup = 1;
      return newTermWithCeoff;
    }
    else {
      return polyNode;
    }
  });

  if (change) {
    return NodeStatus.nodeChanged(
        MathChangeTypes.ADD_COEFFICIENT_OF_ONE, oldNode, newNode, false);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Given a sum of like polynomial terms, changes any term with a unary minus
// coefficient into a term with an explicit coefficient of -1. This is for
// pedagogy, and makes the adding coefficients step clearer.
// e.g. 2x - x -> 2x - 1x
// Returns a NodeStatus object.
function addNegativeOneCoefficient(node) {
  const oldNode = node;
  const newNode = clone(node, false);
  let change = false;

  newNode.args = newNode.args.map(polyNode => {
    const polyTerm = new PolynomialTermNode(polyNode);
    if (polyTerm.getCoeffValue() === -1) {
      change = true;
      polyNode.changeGroup = 1; // note that this is the "oldNode"
      const newTermWithCeoff = NodeCreator.polynomialTerm(
        polyTerm.getSymbolNode(),
        polyTerm.getExponentNode(),
        polyTerm.getCoeffNode(),
        true /* explicit -1 coefficient */);
      newTermWithCeoff.changeGroup = 1;
      return newTermWithCeoff;
    }
    else {
      return polyNode;
    }
  });

  if (change) {
    return NodeStatus.nodeChanged(
      MathChangeTypes.UNARY_MINUS_TO_NEG_ONE, oldNode, newNode, false);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Given a sum of like polynomial terms, groups the coefficients
// e.g. 2x^2 + 3x^2 + 5x^2 -> (2+3+5)x^2
// Returns a NodeStatus object.
function groupCoefficientsForAdding(node) {
  const polynomialTermList = node.args.map(n => new PolynomialTermNode(n));
  const coefficientList = polynomialTermList.map(p => p.getCoeffNode(true));
  const sumOfCoefficents = NodeCreator.parenthesis(
    NodeCreator.operator('+', coefficientList));
  // TODO: changegroups should also be on the before node, on all the
  // coefficients, but changegroups with polyTerm gets messy so let's tackle
  // that later.
  sumOfCoefficents.changeGroup = 1;

  // Polynomial terms that can be added together must share the same symbol
  // name and exponent. Get that name and exponent from the first term
  const firstTerm = polynomialTermList[0];
  const exponentNode = firstTerm.getExponentNode();
  const symbolNode = firstTerm.getSymbolNode();
  const newNode = NodeCreator.polynomialTerm(
    symbolNode, exponentNode, sumOfCoefficents);
  return newNode;
}

// Given a node of the form (2 + 4 + 5)x -- ie the coefficients have been
// grouped for adding -- add the coefficients together to make a new coeffient
// that is a constant or constant fraction.
function evaluateCoefficientSum(node) {
  // the node is now always a * node with the left child the coefficent sum
  // e.g. (2 + 4 + 5) and the right node the symbol part e.g. x or y^2
  // so we want to evaluate args[0]
  const coefficientSum = clone(node, false).args[0];
  let childStatus = evaluateConstantSum(coefficientSum);
  return NodeStatus.childChanged(node, childStatus, 0);
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

// ----- helpers for multiplying polynomial terms -------

// Given a product of polynomial terms, changes any term with no exponent
// into a term with an explicit exponent of 1. This is for pedagogy, and
// makes the adding coefficients step clearer.
// e.g. x^2 * x -> x^2 * x^1
// Returns a NodeStatus object.
function addOneExponent(node) {
  const oldNode = node;
  const newNode = clone(node, false);
  let change = false;

  newNode.args = newNode.args.map(polyNode => {
    const polyTerm = new PolynomialTermNode(polyNode);
    if (!polyTerm.getExponentNode()) {
      change = true;
      polyNode.changeGroup = 1; // note that this is the "oldNode"
      const newTermWithExp = NodeCreator.polynomialTerm(
        polyTerm.getSymbolNode(),
        NodeCreator.constant(1),
        polyTerm.getCoeffNode());
      newTermWithExp.changeGroup = 1;
      return newTermWithExp;
    }
    else {
      return polyNode;
    }
  });

  if (change) {
    return NodeStatus.nodeChanged(
        MathChangeTypes.ADD_EXPONENT_OF_ONE, oldNode, newNode, false);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Given a product of polynomial terms, groups the exponents into a sum
// e.g. x^2 * x^3 * x^1 -> x^(2 + 3 + 1)
// Returns a NodeStatus object.
function collectExponents(node) {
  const oldNode = node;
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
  return NodeStatus.nodeChanged(
    MathChangeTypes.COLLECT_EXPONENTS, oldNode, newNode);
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
