const arithmeticSearch = require('../arithmeticSearch');
const checks = require('../../checks');
const clone = require('../../util/clone');
const ConstantOrPowerTerm = require('./ConstantOrPowerTerm');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// Divides a list of nodes that are polynomial like terms or constants with same base.
// Returns a node.
// The nodes should *not* have coefficients.
function divideLikeTerms(node, polynomialOnly = false) {
  if (!Node.Type.isOperator(node)) {
    return Node.Status.noChange(node);
  }
  let status;
  if (!polynomialOnly && !checks.canDivideLikeTermConstantNodes(node)) {
    status = arithmeticSearch(node);
    if (status.hasChanged()) {
      status.changeType = ChangeTypes.SIMPLIFY_FRACTION;
      return status;
    }
  }

  status = dividePolynomialTerms(node);
  if (status.hasChanged()) {
    status.changeType = ChangeTypes.SIMPLIFY_FRACTION;
    return status;
  }
  return Node.Status.noChange(node);
}
function dividePolynomialTerms(node) {
  if (!checks.canDivideLikeTermPolynomialNodes(node) && !checks.canDivideLikeTermConstantNodes(node)) {
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

  // STEP 2: collect exponents to a single exponent difference
  // e.g. x^1 / x^3 -> x^(1 + -3)
  if (checks.canDivideLikeTermConstantNodes(node)) {
    status = collectConstantExponents(newNode);
  }
  else {
    status = collectPolynomialExponents(newNode);
  }
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // STEP 3: calculate difference of exponents.
  // NOTE: This might not be a step if the exponents aren't all constants,
  // but this case isn't that common and can be caught in other steps.
  // e.g. x^(2-4-z)
  // TODO: handle fractions, combining and collecting like terms, etc, here
  const exponentDiff = newNode.args[1].content;
  const diffStatus = arithmeticSearch(exponentDiff);
  if (diffStatus.hasChanged()) {
    status = Node.Status.childChanged(newNode, diffStatus, 1);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  if (substeps.length === 1) { // possible if only step 2 happens
    return substeps[0];
  }
  else {
    return Node.Status.nodeChanged(
      ChangeTypes.DIVIDE_POLYNOMIAL_TERMS,
      node, newNode, true, substeps);
  }
}

// Given a product of polynomial terms, changes any term with no exponent
// into a term with an explicit exponent of 1. This is for pedagogy, and
// makes the adding coefficients step clearer.
// e.g. x^2 / x -> x^2 / x^1
// Returns a Node.Status object.
function addOneExponent(node) {
  const newNode = clone(node);
  let change = false;

  let changeGroup = 1;
  if (checks.canDivideLikeTermConstantNodes(node)) {
    newNode.args.forEach((child, i) => {
      if (!ConstantOrPowerTerm.getExponentNode(child)) {
        newNode.args[i] = Node.Creator.powerTerm(
          ConstantOrPowerTerm.getBaseNode(child),
          Node.Creator.constant(1));

        newNode.args[i].changeGroup = changeGroup;
        node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"

        change = true;
        changeGroup++;
      }
    });
  }
  else {
    newNode.args.forEach((child, i) => {
      const polyTerm = new Node.PolynomialTerm(child);
      if (!polyTerm.getExponentNode()) {
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
  }

  if (change) {
    return Node.Status.nodeChanged(
      ChangeTypes.ADD_EXPONENT_OF_ONE, node, newNode, false);
  }
  else {
    return Node.Status.noChange(node);
  }
}
// Given a division of constant terms, groups the exponents into a difference
// e.g. 10^5 / 10^3 -> 10^(5 - 3)
// Returns a Node.Status object.
function collectConstantExponents(node) {
  // If we're dividing constant nodes together, they all share the same
  // base. Get that from the first node.
  const baseNode = ConstantOrPowerTerm.getBaseNode(node.args[0]);
  // The new exponent will be a difference of exponents (an operation, wrapped in
  // parens) e.g. 10^(5-3)
  const exponentNodeList = node.args.map(p => ConstantOrPowerTerm.getExponentNode(p));
  const newExponent = Node.Creator.parenthesis(
    Node.Creator.operator('-', exponentNodeList));
  const newNode = Node.Creator.powerTerm(baseNode, newExponent, null);
  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_CONSTANT_EXPONENTS, node, newNode);
}
// Given a division of polynomial terms, groups the exponents into a difference
// e.g. x^5 / x^3 -> x^(5 - 3)
// Returns a Node.Status object.
function collectPolynomialExponents(node) {
  const polynomialTermList = node.args.map(n => new Node.PolynomialTerm(n));

  // If we're dividing polynomial nodes together, they all share the same
  // symbol. Get that from the first node.
  const symbolNode = polynomialTermList[0].getSymbolNode();

  // The new exponent will be a difference of exponents (an operation, wrapped in
  // parens) e.g. x^(5-3)
  const exponentNodeList = polynomialTermList.map(p => p.getExponentNode(true));
  const newExponent = Node.Creator.parenthesis(
    Node.Creator.operator('-', exponentNodeList));
  const newNode = Node.Creator.polynomialTerm(symbolNode, newExponent, null);
  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_POLYNOMIAL_EXPONENTS, node, newNode);
}

module.exports = divideLikeTerms;
