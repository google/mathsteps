const NodeType = require('./Type');
const Term = require('./Term');

// For storing polynomial terms, which are a subclass of Term
// where the base node is a symbol
class PolynomialTerm extends Term {
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

// Returns true if the term has a base node that makes it a polynomial term
// e.g. 4x^2 has a base of x, so it is a polynomial
// 4*sqrt(x)^2 has a base of sqrt(x), so it is not
PolynomialTerm.baseNodeFunc = function(node) {
  return NodeType.isSymbol(node);
};

// Returns true if the node is a polynomial term.
// e.g. x^2, 2y, z, 3x/5 are all polynomial terms.
// 4, 2+x, 3*7, x-z are all not polynomial terms.
// See the tests for some more thorough examples.
PolynomialTerm.isPolynomialTerm = function(
  node, onlyImplicitMultiplication=false) {
  return Term.isTerm(
    node, PolynomialTerm.baseNodeFunc, onlyImplicitMultiplication);
};

module.exports = PolynomialTerm;
