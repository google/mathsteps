'use strict';

const arithmeticSearch = require('../arithmeticSearch');
const checks = require('../../checks');
const clone = require('../../util/clone');
const ChangeTypes = require('../../ChangeTypes');
const multiplyFractionsSearch = require('../multiplyFractionsSearch');
const Node = require('../../node');

// Multiplies a list of nodes that are polynomial like terms. Returns a node.
// The polynomial nodes should *not* have coefficients. (multiplying
// coefficients is handled in collecting like terms for multiplication)
function multiplyLikeTerms(node, polynomialOnly=false) {
  if (!Node.Type.isOperator(node)) {
    return Node.Status.noChange(node);
  }
  let status;

  if (!polynomialOnly) {
    status = arithmeticSearch(node);
    if (status.hasChanged()) {
      status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
      return status;
    }

    status = multiplyFractionsSearch(node);
    if (status.hasChanged()) {
      status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
      return status;
    }
  }

  status = multiplyPolynomialTerms(node);
  if (status.hasChanged()) {
    status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
    return status;
  }

  return Node.Status.noChange(node);
}

function multiplyPolynomialTerms(node) {
  if (!checks.canMultiplyLikeTermPolynomialNodes(node)) {
    return Node.Status.noChange(node);
  }

  const substeps = [];
  let newNode = clone(node);

  // STEP 1: If any term has no exponent, make it have exponent 1
  // e.g. x -> x^1 (this is for pedagogy reasons)
  // (this step only happens under certain conditions and later steps might
  // happen even if step 1 does not)
  let status = addOneExponent(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // STEP 2: collect exponents to a single exponent sum
  // e.g. x^1 * x^3 -> x^(1+3)
  status = collectExponents(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // STEP 3: add exponents together.
  // NOTE: This might not be a step if the exponents aren't all constants,
  // but this case isn't that common and can be caught in other steps.
  // e.g. x^(2+4+z)
  // TODO: handle fractions, combining and collecting like terms, etc, here
  const exponentSum = newNode.args[1].content;
  const sumStatus = arithmeticSearch(exponentSum);
  if (sumStatus.hasChanged()) {
    status = Node.Status.childChanged(newNode, sumStatus, 1);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  if (substeps.length === 1) { // possible if only step 2 happens
    return substeps[0];
  }
  else {
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS,
      node, newNode, true, substeps);
  }
}

// Given a product of polynomial terms, changes any term with no exponent
// into a term with an explicit exponent of 1. This is for pedagogy, and
// makes the adding coefficients step clearer.
// e.g. x^2 * x -> x^2 * x^1
// Returns a Node.Status object.
function addOneExponent(node) {
  const newNode = clone(node);
  let change = false;

  let changeGroup = 1;
  newNode.args.forEach((child, i) => {
    const polyTerm = new Node.PolynomialTerm(child);
    if (!polyTerm.getExponentNode())  {
      newNode.args[i] = Node.Creator.polynomialTerm(
        polyTerm.getSymbolNode(),
        Node.Creator.constant(1),
        polyTerm.getCoeffNode());

      newNode.args[i].changeGroup = changeGroup;
      node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"

      change = true;
      changeGroup++;
    }
  });

  if (change) {
    return Node.Status.nodeChanged(
        ChangeTypes.ADD_EXPONENT_OF_ONE, node, newNode, false);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// Given a product of polynomial terms, groups the exponents into a sum
// e.g. x^2 * x^3 * x^1 -> x^(2 + 3 + 1)
// Returns a Node.Status object.
function collectExponents(node) {
  const polynomialTermList = node.args.map(n => new Node.PolynomialTerm(n));

  // If we're multiplying polynomial nodes together, they all share the same
  // symbol. Get that from the first node.
  const symbolNode = polynomialTermList[0].getSymbolNode();

  // The new exponent will be a sum of exponents (an operation, wrapped in
  // parens) e.g. x^(3+4+5)
  const exponentNodeList = polynomialTermList.map(p => p.getExponentNode(true));
  const newExponent = Node.Creator.parenthesis(
    Node.Creator.operator('+', exponentNodeList));
  const newNode = Node.Creator.polynomialTerm(symbolNode, newExponent, null);
  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_EXPONENTS, node, newNode);
}

module.exports = multiplyLikeTerms;
