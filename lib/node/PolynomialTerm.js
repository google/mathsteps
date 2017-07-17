const NodeType = require('./Type');
const Term = require('./Term');

// For storing polynomial terms, which are a subclass of Term
// where the base node is a symbol
class PolynomialTerm extends Term {
  constructor(node, onlyImplicitMultiplication=false) {
    const values = parseNode(node, onlyImplicitMultiplication);
     this.symbol = values.symbol;
     this.exponent = values.exponent;
     this.coeff = values.coeff;
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

// Parses a given polynomial term node and returns the term's
// symbol, exponent, and coefficient.
// e.g. 3x would return {symbol: 'x', exponent: 1, coeff: 3}
// If the node is not a polynomial term, it will throw an error
function parseNode(node, onlyImplicitMultiplication) {
  let symbol, exponent, coeff;
  if (NodeType.isOperator(node)) {
    if (node.op === '^') {
      const symbolNode = node.args[0];
      if (!NodeType.isSymbol(symbolNode)) {
        throw Error('Expected symbol term, got ' + symbolNode);
      }
      symbol = symbolNode;
      exponent = node.args[1];
    }
    // it's '*' ie it has a coefficient
    else if (node.op === '*') {
      if (onlyImplicitMultiplication && !node.implicit) {
        throw Error('Expected implicit multiplication');
      }
      if (node.args.length !== 2) {
        throw Error('Expected two arguments to *');
      }
      const coeffNode = node.args[0];
      if (!NodeType.isConstantOrConstantFraction(coeffNode)) {
        throw Error('Expected coefficient to be constant or fraction of ' +
          'constants term, got ' + coeffNode);
      }
      coeff = coeffNode;
      const nonCoefficientTerm = new PolynomialTerm(
        node.args[1], onlyImplicitMultiplication);
      if (nonCoefficientTerm.hasCoeff()) {
        throw Error('Cannot have two coefficients ' + coeffNode +
          ' and ' + nonCoefficientTerm.getCoeffNode());
      }
      symbol = nonCoefficientTerm.getSymbolNode();
      exponent = nonCoefficientTerm.getExponentNode();
    }
    // this means there's a fraction coefficient
    else if (node.op === '/') {
      const denominatorNode = node.args[1];
      if (!NodeType.isConstant(denominatorNode)) {
        throw Error('denominator must be constant node, instead of ' +
          denominatorNode);
      }
      const numeratorNode = new PolynomialTerm(
        node.args[0], onlyImplicitMultiplication);
      if (numeratorNode.hasFractionCoeff()) {
        throw Error('Polynomial terms cannot have nested fractions');
      }
      exponent = numeratorNode.getExponentNode();
      symbol = numeratorNode.getSymbolNode();
      const numeratorConstantNode = numeratorNode.getCoeffNode(true);
      coeff = NodeCreator.operator(
        '/', [numeratorConstantNode, denominatorNode]);
    }
    else {
      throw Error('Unsupported operatation for polynomial node: ' + node.op);
    }
  }
  else if (NodeType.isUnaryMinus(node)) {
    var arg = node.args[0];
    if (NodeType.isParenthesis(arg)) {
      arg = arg.content;
    }
    const polyNode = new PolynomialTerm(
      arg, onlyImplicitMultiplication);
    exponent = polyNode.getExponentNode();
    symbol = polyNode.getSymbolNode();
    if (!polyNode.hasCoeff()) {
      coeff = NodeCreator.constant(-1);
    }
    else {
      coeff = negativeCoefficient(polyNode.getCoeffNode());
    }
  }
  else if (NodeType.isSymbol(node)) {
    symbol = node;
  }
  else if (NodeType.isParenthesis(node)) {
    return parseNode(node.content);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }

  return {
    symbol,
    exponent,
    coeff,
  };
}

module.exports = PolynomialTerm;
