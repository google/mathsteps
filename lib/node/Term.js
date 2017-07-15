const NodeCreator = require('./Creator');
const NodeType = require('./Type');

const evaluate = require('../util/evaluate');

// For storing term that have a base node, maybe an exponent, and maybe a coefficient.
// These expressions are Terms:
//   -- x^2, 2y, z, 3x/5 (PolynomialTerm)
//   -- nthRoot(4), 5*nthRoot(x) (NthRootTerm)
// These expressions are not: 4, x^(3+4), 2+x, 3*7, x-z
/* Fields:
 - coeff: either a constant node or a fraction of two constant nodes
   (might be null if no coefficient)
 - base: the base node (e.g. in x^2, the node x)
 - exponent: a node that can take any form, e.g. x^(2+x^2)
   (might be null if no exponent)
*/
class Term {
  // Params:
  // -- node: The node from which to construct the Term
  // -- baseNodeFunc: A boolean function returning true if the base node is of the right type
  //    e.g., for PolynomialTerms, baseNodeFunc checks if the base node is a symbol
  //    for NthRootTerms, baseNodeFunc checks if the base node is an nth root
  // -- onlyImplicitMultiplication: If onlyImplicitMultiplication is true, an error will be thrown if `node`
  //    is a term without implicit multiplication
  //    (i.e. 2*x instead of 2x) and therefore isTerm will return false.
  constructor(node, baseNodeFunc, onlyImplicitMultiplication=false) {
    if (NodeType.isOperator(node)) {
      if (node.op === '^') {
        const baseNode = node.args[0];
        if (!baseNodeFunc(baseNode)) {
          throw Error('Expected base term, got ' + baseNode);
        }
        this.base = baseNode;
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
        const nonCoefficientTerm = new Term(
          node.args[1], baseNodeFunc, onlyImplicitMultiplication);
        if (nonCoefficientTerm.hasCoeff()) {
          throw Error('Cannot have two coefficients ' + coeffNode +
            ' and ' + nonCoefficientTerm.getCoeffNode());
        }
        this.base = nonCoefficientTerm.getBaseNode();
        this.exponent = nonCoefficientTerm.getExponentNode();
      }
      // this means there's a fraction coefficient
      else if (node.op === '/') {
        const denominatorNode = node.args[1];
        if (!NodeType.isConstant(denominatorNode)) {
          throw Error('denominator must be constant node, instead of ' +
            denominatorNode);
        }
        const numeratorNode = new Term(
          node.args[0], baseNodeFunc, onlyImplicitMultiplication);
        if (numeratorNode.hasFractionCoeff()) {
          throw Error('Terms with coefficients cannot have nested fractions');
        }
        this.exponent = numeratorNode.getExponentNode();
        this.base = numeratorNode.getBaseNode();
        const numeratorConstantNode = numeratorNode.getCoeffNode(true);
        this.coeff = NodeCreator.operator(
          '/', [numeratorConstantNode, denominatorNode]);
      }
      else {
        throw Error('Unsupported operatation for term with coefficent: ' + node.op);
      }
    }
    else if (NodeType.isUnaryMinus(node)) {
      var arg = node.args[0];
      if (NodeType.isParenthesis(arg)) {
        arg = arg.content;
      }
      const termNode = new Term(
        arg, baseNodeFunc, onlyImplicitMultiplication);
      this.exponent = termNode.getExponentNode();
      this.base = termNode.getBaseNode();
      if (!termNode.hasCoeff()) {
        this.coeff = NodeCreator.constant(-1);
      }
      else {
        this.coeff = negativeCoefficient(termNode.getCoeffNode());
      }
    }
    else if (baseNodeFunc(node)) {
      this.base = node;
    }
    else {
      throw Error('Unsupported node type: ' + node.type);
    }
  }

  /* GETTER FUNCTIONS */
  getBaseNode() {
    return this.base;
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
      return evaluate(this.coeff);
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

  // note: there is no exponent value getter function because the exponent
  // can be any expression and not necessarily a number.

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

// Returns if the node represents an expression that can be considered
// a term with a coefficient.
Term.isTerm = function(
  node, baseNodeFunc, onlyImplicitMultiplication=false) {
  try {
    // will throw error if node isn't term with coefficient
    new Term(node, baseNodeFunc, onlyImplicitMultiplication);
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

module.exports = Term;
