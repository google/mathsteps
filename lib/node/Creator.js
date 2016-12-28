/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

const math = require('mathjs');
const NodeType = require('./Type');

const NodeCreator = {
  operator: function(op, args, implicit=false) {
    switch (op) {
    case '+':
      return new math.expression.node.OperatorNode('+', 'add', args);
    case '-':
      return new math.expression.node.OperatorNode('-', 'subtract', args);
    case '/':
      return new math.expression.node.OperatorNode('/', 'divide', args);
    case '*':
      return new math.expression.node.OperatorNode(
        '*', 'multiply', args, implicit);
    case '^':
      return new math.expression.node.OperatorNode('^', 'pow', args);
    default:
      throw Error('Unsupported operation: ' + op);
    }
  },

  // In almost all cases, use Negative.negate (with naive = true) to add a
  // unary minus to your node, rather than calling this constructor directly
  unaryMinus: function(content) {
    return new math.expression.node.OperatorNode(
      '-', 'unaryMinus', [content]);
  },

  constant: function(val) {
    return new math.expression.node.ConstantNode(val);
  },

  symbol: function(name) {
    return new math.expression.node.SymbolNode(name);
  },

  parenthesis: function(content) {
    return new math.expression.node.ParenthesisNode(content);
  },

  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the symbol node can never be null.
  polynomialTerm: function(symbol, exponent, coeff, coeffIsNegOne=false) {
    let polyTerm = symbol;
    if (exponent) {
      polyTerm = this.operator('^', [polyTerm, exponent]);
    }
    if (coeff) {
      if (NodeType.isConstant(coeff) &&
          parseFloat(coeff.value) === -1 &&
          !coeffIsNegOne) {
        // if you actually want -1 as the coefficient, set coeffIsNegOne to true
        polyTerm = this.unaryMinus(polyTerm);
      }
      else {
        polyTerm = this.operator('*', [coeff, polyTerm], true);
      }
    }
    return polyTerm;
  },

  // Given a root value and a radicand (what is under the radical)
  nthRoot: function(radicandNode, rootNode) {
    const symbol = NodeCreator.symbol('nthRoot');
    return new math.expression.node.FunctionNode(symbol, [radicandNode, rootNode]);
  }
};

module.exports = NodeCreator;
