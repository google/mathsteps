const NodeCreator = require('./Creator');
const NodeType = require('./Type');

const evaluate = require('../util/evaluate');

// For storing terms with coefficients
// Has a base node, maybe an exponent, and maybe a coefficient.
// These expressions are of the form of a TermWithCoefficient:
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
class TermWithCoefficient {
  // if onlyImplicitMultiplication is true, an error will be thrown if `node`
  // is a term without implicit multiplication
  // (i.e. 2*x instead of 2x) and therefore isTermWithCoefficient will return false.
  constructor(node, onlyImplicitMultiplication=false) {
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

module.exports = TermWithCoefficient;
