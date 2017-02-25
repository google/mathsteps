/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

const NodeType = require('./Type');

const opFns = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'pow',
};

const operatorNode = (op, fn, args) => {
  return {
    type: 'OperatorNode',
    op: op,
    fn: fn,
    args: args,
  };
};

const NodeCreator = {
  operator (op, args, implicit=false) {
    if (op in opFns) {
      if (op === '-' && args.length === 1) {
        debugger;
      }
      return operatorNode(op, opFns[op], args);
    } else {
      throw Error('Unsupported operation: ' + op);
    }
  },

  // In almost all cases, use Negative.negate (with naive = true) to add a
  // unary minus to your node, rather than calling this constructor directly
  unaryMinus (content) {
    return operatorNode('-', 'unaryMinus', [content]);
  },

  constant (val) {
    return {
      type: "ConstantNode",
      valueType: "number",
      value: String(val),
    }
  },

  symbol (name) {
    return {
      type: "SymbolNode",
      name: name,
    }
    // return new math.expression.node.SymbolNode(name);
  },

  parenthesis (content) {
    return {
      type: 'ParenthesisNode',
      content: content,
    }
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
    const symbol = NodeCreator.symbol('nthRoot');
    return {
      type: "FunctionNode",
      fn: symbol,
      args: [radicandNode, rootNode],
    }
  }
};

module.exports = NodeCreator;
