const NodeCreator = require('./Creator');
const NodeType = require('./Type');

class ConstantTerms {
  constructor(node) {
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


module.exports = ConstantTerms;