'use strict';

const clone = require('../clone');
const ConstantFraction = require('../ConstantFraction');
const evaluateArithmetic = require('../evaluateArithmetic');
const NodeCreator = require('../NodeCreator');
const NodeStatus = require('../NodeStatus');
const PolynomialTermNode = require('../PolynomialTermNode');

// Simplifies a polynomial term with a fraction as its coefficients.
// e.g. 2x/4 --> x/2    10x/5 --> 2x
// Also simplified negative signs
// e.g. -y/-3 --> y/3   4x/-5 --> -4x/5
// returns the new simplified node in a NodeStatus object
function simplifyPolynomialFraction(node) {
  if (!PolynomialTermNode.isPolynomialTerm(node)) {
    return NodeStatus.noChange(node);
  }

  const polyNode = new PolynomialTermNode(clone(node));
  if (!polyNode.hasFractionCoeff()) {
    return NodeStatus.noChange(node);
  }

  const coefficientSimplifications = [
    ConstantFraction.divideByGCD, // for integer fractions
    evaluateArithmetic, // for decimal fractions
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
      const newNode = NodeCreator.polynomialTerm(
          polyNode.getSymbolNode(), exponentNode, newCoeff);
      return NodeStatus.nodeChanged(newCoeffStatus.changeType, node, newNode);
    }
  }

  return NodeStatus.noChange(node);
};

module.exports = simplifyPolynomialFraction;
