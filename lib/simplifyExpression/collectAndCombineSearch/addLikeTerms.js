'use strict';

const checks = require('../../checks');
const clone = require('../../util/clone');
const ChangeTypes = require('../../ChangeTypes');
const evaluateConstantSum = require('./evaluateConstantSum');
const Node = require('../../node');

// Adds a list of nodes that are polynomial terms. Returns a Node.Status object.
function addLikeTerms(node, polynomialOnly=false) {
  if (!Node.Type.isOperator(node)) {
    return Node.Status.noChange(node);
  }
  let status;

  if (!polynomialOnly) {
    status = evaluateConstantSum(node);
    if (status.hasChanged()) {
      return status;
    }
  }

  status = addLikePolynomialTerms(node);
  if (status.hasChanged()) {
    return status;
  }

  return Node.Status.noChange(node);
}

function addLikePolynomialTerms(node) {
  if (!checks.canAddLikeTermPolynomialNodes(node)) {
    return Node.Status.noChange(node);
  }

  const substeps = [];
  let newNode = clone(node);

  // STEP 1: If any nodes have no coefficient, make it have coefficient 1
  // (this step only happens under certain conditions and later steps might
  // happen even if step 1 does not)
  let status = addPositiveOneCoefficient(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // STEP 2: If any nodes have a unary minus, make it have coefficient -1
  // (this step only happens under certain conditions and later steps might
  // happen even if step 2 does not)
  status = addNegativeOneCoefficient(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // STEP 3: group the coefficients in a sum
  status = groupCoefficientsForAdding(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // STEP 4: evaluate the sum (could include fractions)
  status = evaluateCoefficientSum(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  return Node.Status.nodeChanged(
    ChangeTypes.ADD_POLYNOMIAL_TERMS,
    node, newNode, true, substeps);
}

// Given a sum of like polynomial terms, changes any term with no coefficient
// into a term with an explicit coefficient of 1. This is for pedagogy, and
// makes the adding coefficients step clearer.
// e.g. 2x + x -> 2x + 1x
// Returns a Node.Status object.
function addPositiveOneCoefficient(node) {
  const newNode = clone(node, false);
  let change = false;

  let changeGroup = 1;
  newNode.args.forEach((child, i) => {
    const polyTerm = new Node.PolynomialTerm(child);
    if (polyTerm.getCoeffValue() === 1) {
      newNode.args[i] = Node.Creator.polynomialTerm(
        polyTerm.getSymbolNode(),
        polyTerm.getExponentNode(),
        Node.Creator.constant(1));

      newNode.args[i].changeGroup = changeGroup;
      node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"

      change = true;
      changeGroup++;
    }
  });

  if (change) {
    return Node.Status.nodeChanged(
        ChangeTypes.ADD_COEFFICIENT_OF_ONE, node, newNode, false);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Given a sum of like polynomial terms, changes any term with a unary minus
// coefficient into a term with an explicit coefficient of -1. This is for
// pedagogy, and makes the adding coefficients step clearer.
// e.g. 2x - x -> 2x - 1x
// Returns a Node.Status object.
function addNegativeOneCoefficient(node) {
  const newNode = clone(node);
  let change = false;

  let changeGroup = 1;
  newNode.args.forEach((child, i) => {
    const polyTerm = new Node.PolynomialTerm(child);
    if (polyTerm.getCoeffValue() === -1) {
      newNode.args[i] = Node.Creator.polynomialTerm(
        polyTerm.getSymbolNode(),
        polyTerm.getExponentNode(),
        polyTerm.getCoeffNode(),
        true /* explicit -1 coefficient */);

      node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"
      newNode.args[i].changeGroup = changeGroup;

      change = true;
      changeGroup++;
    }
  });

  if (change) {
    return Node.Status.nodeChanged(
      ChangeTypes.UNARY_MINUS_TO_NEGATIVE_ONE, node, newNode, false);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Given a sum of like polynomial terms, groups the coefficients
// e.g. 2x^2 + 3x^2 + 5x^2 -> (2+3+5)x^2
// Returns a Node.Status object.
function groupCoefficientsForAdding(node) {
  let newNode = clone(node);

  const polynomialTermList = newNode.args.map(n => new Node.PolynomialTerm(n));
  const coefficientList = polynomialTermList.map(p => p.getCoeffNode(true));
  const sumOfCoefficents = Node.Creator.parenthesis(
    Node.Creator.operator('+', coefficientList));
  // TODO: changegroups should also be on the before node, on all the
  // coefficients, but changegroups with polyTerm gets messy so let's tackle
  // that later.
  sumOfCoefficents.changeGroup = 1;

  // Polynomial terms that can be added together must share the same symbol
  // name and exponent. Get that name and exponent from the first term
  const firstTerm = polynomialTermList[0];
  const exponentNode = firstTerm.getExponentNode();
  const symbolNode = firstTerm.getSymbolNode();
  newNode = Node.Creator.polynomialTerm(
    symbolNode, exponentNode, sumOfCoefficents);

  return Node.Status.nodeChanged(
    ChangeTypes.GROUP_COEFFICIENTS, node, newNode);
}

// Given a node of the form (2 + 4 + 5)x -- ie the coefficients have been
// grouped for adding -- add the coefficients together to make a new coeffient
// that is a constant or constant fraction.
function evaluateCoefficientSum(node) {
  // the node is now always a * node with the left child the coefficent sum
  // e.g. (2 + 4 + 5) and the right node the symbol part e.g. x or y^2
  // so we want to evaluate args[0]
  const coefficientSum = clone(node).args[0];
  const childStatus = evaluateConstantSum(coefficientSum);
  return Node.Status.childChanged(node, childStatus, 0);
}

module.exports = addLikeTerms;
