const TermWithCoefficient = require('./TermWithCoefficient');
const NodeCreator = require('./Creator');
const NodeType = require('./Type');

const evaluate = require('../util/evaluate');

// For storing polynomial terms.
// A TermWithCoefficient where the base node is a symbol (e.g. x)
class PolynomialTerm extends TermWithCoefficient {
  constructor(node, onlyImplicitMultiplication=false) {
    super(node, PolynomialTerm.baseNodeFunc, onlyImplicitMultiplication);
  }

  getSymbolNode() {
    return this.base;
  }

  getSymbolName() {
    return this.base.name;
  }
}

PolynomialTerm.baseNodeFunc = function(node) {
  return NodeType.isSymbol(node);
}

// Returns if the node represents an expression that can be considered a polynomial term.
// e.g. x^2, 2y, z, 3x/5 are all terms. 4, 2+x, 3*7, x-z are all not polynomial terms.
// See the tests for some more thorough examples of exactly what counts and
// what does not.
PolynomialTerm.isPolynomialTerm = function(
  node, onlyImplicitMultiplication=false) {
  return TermWithCoefficient.isTermWithCoefficient(
    node, PolynomialTerm.baseNodeFunc, onlyImplicitMultiplication);
};

module.exports = PolynomialTerm;
