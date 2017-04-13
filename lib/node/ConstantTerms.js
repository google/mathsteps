const NodeCreator = require('./Creator');
const NodeType = require('./Type');

class ConstantTerms {
  constructor(node, onlyImplicitMultiplication=false) {
    if (NodeType.isOperator(node)) {
      if (node.op === '^') {
        const constantNode = node.args[0];
        if (!NodeType.isConstant(constantNode)) {
          //throw Error('Expected constant term, got ' + constantNode);
          return false;
        }
        this.base = constantNode;
        this.exponent = node.args[1];
      }
      else if (node.op === '*'){
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
        const nonCoefficientTerm = new ConstantTerms(
          node.args[1], onlyImplicitMultiplication);
        if (nonCoefficientTerm.hasCoeff()) {
          throw Error('Cannot have two coefficients ' + coeffNode +
            ' and ' + nonCoefficientTerm.getCoeffNode());
        }
        this.base = nonCoefficientTerm.getBaseNode();
        this.exponent = nonCoefficientTerm.getExponentNode();
      }
      else if (node.op === '/') {
        const denominatorNode = node.args[1];
        if (!NodeType.isConstant(denominatorNode)) {
          //throw Error('denominator must be constant node, instead of ' +
            //denominatorNode);
          return false;
        }
        const numeratorNode = new ConstantTerms(
          node.args[0]);
        this.exponent = numeratorNode.getExponentNode();
        this.base = numeratorNode.getBaseNode();
      }
    }
    else if (NodeType.isUnaryMinus(node)) {
      var arg = node.args[0];
      if (NodeType.isParenthesis(arg)) {
        arg = arg.content;
      }
      const constNode = new ConstantTerms(
        arg, onlyImplicitMultiplication);
      this.exponent = constNode.getExponentNode();
      this.base = constNode.getBaseNode();
      if (!constNode.hasCoeff()) {
        this.coeff = NodeCreator.constant(-1);
      }
      else {
        this.coeff = negativeCoefficient(constNode.getCoeffNode());
      }
    }
    else if (NodeType.isConstant(node)) {
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
  getBaseValue() {
    return this.base.value;
  }

  getExponentNode(defaultOne = false) {
    if (!this.exponent && defaultOne) {
      return NodeCreator.constant(1);
    }
    else {
      return this.exponent;
    }
  }
  getCoeffNode(defaultOne=false) {
    if (!this.coeff && defaultOne) {
      return NodeCreator.constant(1);
    }
    else {
      return this.coeff;
    }
  }
  hasCoeff() {
    return !!this.coeff;
  }
}
// Returns if the node represents an expression that can be considered a term.
// e.g. 2^2, 10^4, 6^2 are all terms. 4, 2+x, 3*7, x-z are all not terms.
// See the tests for some more thorough examples of exactly what counts and
// what does not.
ConstantTerms.isConstantTerm = function (node, onlyImplicitMultiplication = false) {
  try {
    // will throw error if node isn't poly term
    new ConstantTerms(node, onlyImplicitMultiplication);
    return true;
  }
  catch (err) {
    return false;
  }
};
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


module.exports = ConstantTerms;