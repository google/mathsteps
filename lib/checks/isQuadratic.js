'use strict';

const Node = require('../node');

// TODO(ael)
function isQuadratic(node) {
  if (!Node.Type.isOperator(node) || node.op !== '+') {
    return false;
  }

  if (node.args.length > 3) {
    return false;
  }

  const secondDegreeTerms = node.args.filter(isSecondDegree);
  const firstDegreeTerms = node.args.filter(isFirstDegree);
  const constantTerms = node.args.filter(Node.Type.isConstant);

  if (secondDegreeTerms.length !== 1 || firstDegreeTerms.length > 1 ||
    constantTerms.length !== 1) {
    return false;
  }

  return true;
}

function isFirstDegree(node) {
  if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new Node.PolynomialTerm(node);
    const exponent = polyTerm.getExponentNode(true);
    return exponent && exponent.value === '1';
  }
  return false;
}

function isSecondDegree(node) {
  if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new Node.PolynomialTerm(node);
    const exponent = polyTerm.getExponentNode(true);
    return exponent && exponent.value === '2';
  }
  return false;
}

module.exports = isQuadratic;
