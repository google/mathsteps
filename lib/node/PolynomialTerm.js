'use strict';

const NodeCreator = require('./Creator');
const NodeType = require('./Type');

// For storing polynomial terms.
// Has a symbol (e.g. x), maybe an exponent, and maybe a coefficient.
// These expressions are of the form of a PolynomialTerm: x^2, 2y, z, 3x/5
// These expressions are not: 4, x^(3+4), 2+x, 3*7, x-z
/* Fields:
 - coeff: either a constant node or a fraction of two constant nodes
   (might be null if no coefficient)
 - symbol: the node with the symbol (e.g. in x^2, the node x)
 - exponent: a node that can take any form, e.g. x^(2+x^2)
   (might be null if no exponent)
*/
class PolynomialTerm {
  // if onlyImplicitMultiplication is true, an error will be thrown if `node`
  // is a polynomial term without implicit multiplication
  // (i.e. 2*x instead of 2x) and therefore isPolynomialTerm will return false.
  constructor(node, onlyImplicitMultiplication=false) {
    if (NodeType.isOperator(node)) {
      if (node.op === '^') {
        const symbolNode = node.args[0];
        if (!NodeType.isSymbol(symbolNode)) {
          throw Error('Expected symbol term, got ' + symbolNode);
        }
        this.symbol = symbolNode;
        this.exponent = node.args[1];
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
        this.coeff = coeffNode;
        const nonCoefficientTerm = new PolynomialTerm(
          node.args[1], onlyImplicitMultiplication);
        if (nonCoefficientTerm.hasCoeff()) {
          throw Error('Cannot have two coefficients ' + coeffNode +
            ' and ' + nonCoefficientTerm.getCoeffNode());
        }
        this.symbol = nonCoefficientTerm.getSymbolNode();
        this.exponent = nonCoefficientTerm.getExponentNode();
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
        this.exponent = numeratorNode.getExponentNode();
        this.symbol = numeratorNode.getSymbolNode();
        const numeratorConstantNode = numeratorNode.getCoeffNode(true);
        this.coeff = NodeCreator.operator(
          '/', [numeratorConstantNode, denominatorNode]);
      }
      else {
        throw Error('Unsupported operatation for polynomial node: ' + node.op);
      }
    }
    else if (NodeType.isUnaryMinus(node)) {
      var arg = node.args[0];
      if(NodeType.isParenthesis(arg)) {
        arg = arg.content;
      }
      const polyNode = new PolynomialTerm(
        arg, onlyImplicitMultiplication);
      this.exponent = polyNode.getExponentNode();
      this.symbol = polyNode.getSymbolNode();
      if (!polyNode.hasCoeff()) {
        this.coeff = NodeCreator.constant(-1);
      }
      else {
        this.coeff = negativeCoefficient(polyNode.getCoeffNode());
      }
    }
    else if (NodeType.isSymbol(node)) {
      this.symbol = node;
    }
    else {
      throw Error('Unsupported node type: ' + node.type);
    }
  }

  /* GETTER FUNCTIONS */
  getSymbolNode() {
    return this.symbol;
  }

  getSymbolName() {
    return this.symbol.name;
  }

  getCoeffNode(defaultOne=false) {
    if (!this.coeff && defaultOne) {
      return NodeCreator.constant(1);
    }
    else {
      return this.coeff;
    }
  }

  getCoeffValue() {
    if (this.coeff) {
      return this.coeff.eval();
    }
    else {
      return 1; // no coefficient is like a coeff of 1
    }
  }

  getExponentNode(defaultOne=false) {
    if (!this.exponent && defaultOne) {
      return NodeCreator.constant(1);
    }
    else {
      return this.exponent;
    }
  }

  getRootNode() {
    return NodeCreator.polynomialTerm(
      this.symbol, this.exponent, this.coeff);
  }

  // note: there is no exponent value getter function because the exponent
  // can be any expresion and not necessarily a number.

  /* CHECKER FUNCTIONS (returns true / false for certain conditions) */

  // Returns true if the coefficient is a fraction
  hasFractionCoeff() {
    // coeffNode is either a constant or a division operation.
    return this.coeff && NodeType.isOperator(this.coeff);
  }

  hasCoeff() {
    return !!this.coeff;
  }
}

// Returns if the node represents an expression that can be considered a term.
// e.g. x^2, 2y, z, 3x/5 are all terms. 4, 2+x, 3*7, x-z are all not terms.
// See the tests for some more thorough examples of exactly what counts and
// what does not.
PolynomialTerm.isPolynomialTerm = function(
    node, onlyImplicitMultiplication=false) {
  try {
    // will throw error if node isn't poly term
    new PolynomialTerm(node, onlyImplicitMultiplication);
    return true;
  }
  catch (err) {
    return false;
  }
};

// Multiplies `node`, a constant or fraction of two constant nodes, by -1
// Returns a node
function negativeCoefficient(node) {
  if (NodeType.isConstant(node)) {
    node = NodeCreator.constant(0 - parseFloat(node.value));
  }
  else {
    const numeratorValue = 0 - parseFloat(node.args[0].value);
    node.args[0] = NodeCreator.constant(numeratorValue);
  }
  return node;
}

module.exports = PolynomialTerm;
