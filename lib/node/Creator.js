// @flow

/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

type value = string | number;

type baseNode = {
  [property: string]: value
}

const math = require('mathjs');
const NodeType = require('./Type');

const NodeCreator = {
  operator (op: string, args: Array<baseNode>, implicit: boolean=false) {
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
  unaryMinus (content: Array<baseNode>) {
    return new math.expression.node.OperatorNode(
      '-', 'unaryMinus', [content]);
  },

  constant (val: number) {
    return new math.expression.node.ConstantNode(val);
  },

  symbol (name: string) {
    return new math.expression.node.SymbolNode(name);
  },

  parenthesis (content: value) {
    return new math.expression.node.ParenthesisNode(content);
  },

  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the symbol node can never be null.
  polynomialTerm (symbol: baseNode, exponent: baseNode, coeff: Object, explicitCoeff: boolean=false) {
    let polyTerm = symbol;
    if (exponent) {
      polyTerm = this.operator('^', [polyTerm, exponent]);
    }
    if (coeff && (explicitCoeff || parseFloat(coeff.value) !== 1)) {
      if (NodeType.isConstant(coeff) &&
          parseFloat(coeff.value) === -1 &&
          !explicitCoeff) {
        // if you actually want -1 as the coefficient, set explicitCoeff to true
        polyTerm = this.unaryMinus(polyTerm);
      }
      else {
        polyTerm = this.operator('*', [coeff, polyTerm], true);
      }
    }
    return polyTerm;
  },

  // Given a root value and a radicand (what is under the radical)
  nthRoot (radicandNode: baseNode, rootNode: baseNode) {
    const symbol = NodeCreator.symbol('nthRoot');
    return new math.expression.node.FunctionNode(symbol, [radicandNode, rootNode]);
  }
};

module.exports = NodeCreator;
