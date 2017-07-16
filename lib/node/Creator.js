/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

const math = require('mathjs');
const NodeType = require('./Type');

const NodeCreator = {
  operator (op, args, implicit=false) {
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
  unaryMinus (content) {
    return new math.expression.node.OperatorNode(
      '-', 'unaryMinus', [content]);
  },

  constant (val) {
    return new math.expression.node.ConstantNode(val);
  },

  symbol (name) {
    return new math.expression.node.SymbolNode(name);
  },

  parenthesis (content) {
    return new math.expression.node.ParenthesisNode(content);
  },

  list (content) {
    return new math.expression.node.ArrayNode(content);
  },

  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the base node can never be null.
  term (base, exponent, coeff, explicitCoeff=false) {
    let term = base;
    if (exponent) {
      term = this.operator('^', [term, exponent]);
    }
    if (coeff && (explicitCoeff || parseFloat(coeff.value) !== 1)) {
      if (NodeType.isConstant(coeff) &&
          parseFloat(coeff.value) === -1 &&
          !explicitCoeff) {
        // if you actually want -1 as the coefficient, set explicitCoeff to true
        term = this.unaryMinus(term);
      }
      else {
        term = this.operator('*', [coeff, term], true);
      }
    }
    return term;
  },

  polynomialTerm (symbol, exponent, coeff, explicitCoeff=false) {
    return this.term(symbol, exponent, coeff, explicitCoeff);
  },

  // Given a root value and a radicand (what is under the radical)
  nthRoot (radicandNode, rootNode) {
    const symbol = NodeCreator.symbol('nthRoot');
    return new math.expression.node.FunctionNode(symbol, [radicandNode, rootNode]);
  }
};

module.exports = NodeCreator;
