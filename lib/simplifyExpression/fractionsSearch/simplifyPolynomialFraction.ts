import arithmeticSearch = require('../arithmeticSearch');
import clone = require('../../util/clone');
import divideByGCD = require('./divideByGCD');
const mathNode = require('../../node');

// Simplifies a polynomial term with a fraction as its coefficients.
// e.g. 2x/4 --> x/2    10x/5 --> 2x
// Also simplified negative signs
// e.g. -y/-3 --> y/3   4x/-5 --> -4x/5
// returns the new simplified node in a mathNode.Status object
function simplifyPolynomialFraction(node: any);
function simplifyPolynomialFraction(node) {
  if (!mathNode.PolynomialTerm.isPolynomialTerm(node)) {
    return mathNode.Status.noChange(node);
  }

  const polyNode = new mathNode.PolynomialTerm(clone(node));
  if (!polyNode.hasFractionCoeff()) {
    return mathNode.Status.noChange(node);
  }

  const coefficientSimplifications = [
    divideByGCD, // for integer fractions
    arithmeticSearch, // for decimal fractions
  ];

  for (let i = 0; i < coefficientSimplifications.length; i++) {
    const coefficientFraction = polyNode.getCoeffNode(); // a division node
    const newCoeffStatus = coefficientSimplifications[i](coefficientFraction);
    if (newCoeffStatus.hasChanged()) {
      let newCoeff = newCoeffStatus.newNode;
      if (newCoeff.value === '1') {
        newCoeff = null;
      }
      const exponentNode = polyNode.getExponentNode();
      const newNode = mathNode.Creator.polynomialTerm(
          polyNode.getSymbolNode(), exponentNode, newCoeff);
      return mathNode.Status.nodeChanged(newCoeffStatus.changeType, node, newNode);
    }
  }

  return mathNode.Status.noChange(node);
}

export = simplifyPolynomialFraction;
