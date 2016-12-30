'use strict';

const Node = require('./node');

const Negative = {};

// Returns if the given node is negative. Treats a unary minus as a negative,
// as well as a negative constant value or a constant fraction that would
// evaluate to a negative number
Negative.isNegative = function(node) {
  if (Node.Type.isUnaryMinus(node)) {
    return !Negative.isNegative(node.args[0]);
  }
  else if (Node.Type.isConstant(node)) {
    return parseFloat(node.value) < 0;
  }
  else if (Node.Type.isConstantFraction(node)) {
    const numeratorValue = parseFloat(node.args[0].value);
    const denominatorValue = parseFloat(node.args[1].value);
    if (numeratorValue < 0 || denominatorValue < 0) {
      return !(numeratorValue < 0 && denominatorValue < 0);
    }
  }
  else if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyNode = new Node.PolynomialTerm(node);
    return Negative.isNegative(polyNode.getCoeffNode(true));
  }

  return false;
};

// Given a node, returns the negated node
// If naive is true, then we just add an extra unary minus to the expression
// otherwise, we do the actual negation
// E.g.
//    not naive: -3 -> 3, x -> -x
//    naive: -3 -> --3, x -> -x
Negative.negate = function(node, naive=false) {
  if (Node.Type.isConstantFraction(node)) {
    node.args[0] = Negative.negate(node.args[0], naive);
    return node;
  }
  else if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    return Negative.negatePolynomialTerm(node, naive);
  }
  else if (!naive) {
    if (Node.Type.isUnaryMinus(node)) {
      return node.args[0];
    }
    else if (Node.Type.isConstant(node)) {
      return Node.Creator.constant(0 - parseFloat(node.value));
    }
  }
  return Node.Creator.unaryMinus(node);
};

// Multiplies a polynomial term by -1 and returns the new node
// If naive is true, then we just add an extra unary minus to the expression
// otherwise, we do the actual negation
// E.g.
//    not naive: -3x -> 3x, x -> -x
//    naive: -3x -> --3x, x -> -x
Negative.negatePolynomialTerm = function(node, naive=false) {
  if(!Node.PolynomialTerm.isPolynomialTerm(node)) {
    throw Error('node is not a polynomial term');
  }
  const polyNode = new Node.PolynomialTerm(node);

  let newCoeff;
  if (!polyNode.hasCoeff()) {
    newCoeff = Node.Creator.constant(-1);
  }
  else {
    const oldCoeff = polyNode.getCoeffNode();
    if (oldCoeff.value === '-1') {
      newCoeff = null;
    }
    else if (polyNode.hasFractionCoeff()) {
      let numerator = oldCoeff.args[0];
      numerator = Negative.negate(numerator, naive);

      const denominator = oldCoeff.args[1];
      newCoeff = Node.Creator.operator('/', [numerator, denominator]);
    }
    else {
      newCoeff = Negative.negate(oldCoeff, naive);
      if (newCoeff.value === '1') {
        newCoeff = null;
      }
    }
  }
  return Node.Creator.polynomialTerm(
    polyNode.getSymbolNode(), polyNode.getExponentNode(), newCoeff);
};

module.exports = Negative;
