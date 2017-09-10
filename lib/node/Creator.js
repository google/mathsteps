/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

const {build} = require('math-nodes');

const NodeType = require('./Type');

const NodeCreator = {
  operator (op, args, implicit=false) {
    switch (op) {
    case '+':
      return build.add(...args);
    case '-':
      return build.sub(...args);
    case '/':
      return build.div(...args);
    case '*':
      return implicit ? build.implicitMul(...args) : build.mul(...args);
    case '^':
      return build.pow(...args);
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

  list (content) {
    // TODO(math-nodes): come up with a node to express multiple solutions
    return content;
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
    return build.nthRoot(radicandNode, rootNode); // TODO: rename this to index everywhere? or rename index in math-nodes?
  }
};

module.exports = NodeCreator;
