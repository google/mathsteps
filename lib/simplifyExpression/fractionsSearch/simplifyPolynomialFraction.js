const arithmeticSearch = require('../arithmeticSearch');
const clone = require('../../util/clone');
const divideByGCD = require('./divideByGCD');
const Node = require('../../node');

// Simplifies a polynomial term with a fraction as its coefficients.
// e.g. 2x/4 --> x/2    10x/5 --> 2x
// Also simplified negative signs
// e.g. -y/-3 --> y/3   4x/-5 --> -4x/5
// returns the new simplified node in a Node.Status object
function simplifyPolynomialFraction(node) {
  if (!Node.PolynomialTerm.isPolynomialTerm(node)) {
    return Node.Status.noChange(node);
  }

  const polyNode = new Node.PolynomialTerm(clone(node));
  if (!polyNode.hasFractionCoeff()) {
    return Node.Status.noChange(node);
  }

  const coefficientSimplifications = [
    divideByGCD, // for integer fractions
    arithmeticSearch, // for decimal fractions
  ];

  for (let i = 0; i < coefficientSimplifications.length; i++) {
    const coefficientFraction = polyNode.getCoeffNode(); // a division node
    const newCoeffStatus = coefficientSimplifications[i](coefficientFraction);
    if (newCoeffStatus.hasChanged()) {
      // we need to reset change groups because we're creating a new node
      let newCoeff = Node.Status.resetChangeGroups(newCoeffStatus.newNode);
      if (newCoeff.value === '1') {
        newCoeff = null;
      }
      const exponentNode = polyNode.getExponentNode();
      const newNode = Node.Creator.polynomialTerm(
          polyNode.getSymbolNode(), exponentNode, newCoeff);
      return Node.Status.nodeChanged(newCoeffStatus.changeType, node, newNode);
    }
  }

  return Node.Status.noChange(node);
}

module.exports = simplifyPolynomialFraction;
