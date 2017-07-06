/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

const math = require('mathjs');
const NodeType = require('./Type');
const {build} = require('math-nodes');

const NodeCreator = {
  operator (op, args, imp=false) {
    switch (op) {
    case '+':
      return build.add(...args);
    case '-':
      return build.sub(...args);
    case '/':
      return build.div(...args);
    case '*':
      return build.apply('mul', args, {implicit: imp})
    case '^':
      return build.pow(args[0], args[1]);
    default:
      throw Error('Unsupported operation: ' + op);
    }
  },

  // In almost all cases, use Negative.negate (with naive = true) to add a
  // unary minus to your node, rather than calling this constructor directly
  unaryMinus (content) {
    return build.neg(content);
  },

  constant (val) {
    return build.number(val);
  },

  symbol (name) {
    return build.identifier(name);
  },

  parenthesis (content) {
    return build.parens(content);
  },

  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the symbol node can never be null.
  polynomialTerm (symbol, exponent, coeff, explicitCoeff=false) {
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
  nthRoot (radicandNode, rootNode) {
    return build.nthRoot(radicandNode, rootNode);
  }
};

module.exports = NodeCreator;
