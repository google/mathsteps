const clone = require('./util/clone');
const Node = require('./node');
const {build, query} = require('math-nodes');

const Negative = {};

// Given a node, returns the negated node
// If naive is true, then we just add an extra unary minus to the expression
// otherwise, we do the actual negation
// E.g.
//    not naive: -3 -> 3, x -> -x
//    naive: -3 -> --3, x -> -x
Negative.negate = function(node, naive=false) {
  if (query.isConstantFraction(node)) {
    node.args[0] = Negative.negate(node.args[0], naive);
    return node;
  }
  else if (query.isPolynomialTerm(node) && !query.isNumber(node)) {
    return Negative.negatePolynomialTerm(node, naive);
  }
  else if (!naive) {
    if (query.isNeg(node)) {
      return node.args[0];
    }
    else if (query.isNumber(node)) {
      return build.number(0 - parseFloat(query.getValue(node)));
    }
  }
  return build.neg(node);
};

// Multiplies a polynomial term by -1 and returns the new node
// If naive is true, then we just add an extra unary minus to the expression
// otherwise, we do the actual negation
// E.g.
//    not naive: -3x -> 3x, x -> -x
//    naive: -3x -> --3x, x -> -x
Negative.negatePolynomialTerm = function(node, naive=false) {
  if (!query.isPolynomialTerm(node)) {
    throw Error('node is not a polynomial term');
  }
  const polyNode = clone(node);

  let newCoeff;
  if (query.getValue(query.getCoefficient(polyNode)) == 1) {
    return build.neg(polyNode);
  }
  else {
    const oldCoeff = query.getCoefficient(polyNode);
    if (query.getValue(oldCoeff) === -1) {
      newCoeff = null;
    }
    else if (query.isFraction(query.getCoefficient(polyNode))) {
      let numerator = oldCoeff.args[0];
      numerator = Negative.negate(numerator, naive);

      const denominator = oldCoeff.args[1];
      newCoeff = build.div(numerator, denominator);
    }
    else {
      newCoeff = Negative.negate(oldCoeff, naive);
      if (query.getValue(newCoeff) === 1) {
        newCoeff = null;
      }
    }
  }
  return build.implicitMul(newCoeff, ...query.getVariableFactors(polyNode));
};

module.exports = Negative;
