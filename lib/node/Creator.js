/*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/

const math = require('mathjs')
const NodeType = require('./Type')

const NodeCreator = {
  operator (op, args, implicit = false) {
    switch (op) {
      case '+':
        return new math.OperatorNode('+', 'add', args)
      case '-':
        return new math.OperatorNode('-', 'subtract', args)
      case '/':
        return new math.OperatorNode('/', 'divide', args)
      case '*':
        return new math.OperatorNode(
          '*', 'multiply', args, implicit)
      case '^':
        return new math.OperatorNode('^', 'pow', args)
      default:
        throw Error('Unsupported operation: ' + op)
    }
  },

  // In almost all cases, use Negative.negate (with naive = true) to add a
  // unary minus to your node, rather than calling this constructor directly
  unaryMinus (content) {
    return new math.OperatorNode(
      '-', 'unaryMinus', [content])
  },

  constant (val) {
    return new math.ConstantNode(math.bignumber(val))
  },

  symbol (name) {
    return new math.SymbolNode(name)
  },

  parenthesis (content) {
    return new math.ParenthesisNode(content)
  },

  list (content) {
    return new math.ArrayNode(content)
  },

  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the base node can never be null.
  term (base, exponent, coeff, explicitCoeff = false) {
    let term = base
    if (exponent) {
      term = this.operator('^', [term, exponent])
    }

    if (coeff && (explicitCoeff || math.unequal(coeff.value, 1))) {
      if (NodeType.isConstant(coeff) &&
          math.equal(coeff.value, -1) &&
          !explicitCoeff) {

        // if you actually want -1 as the coefficient, set explicitCoeff to true
        term = this.unaryMinus(term)
      } else {
        term = this.operator('*', [coeff, term], true)
      }
    }
    return term
  },

  polynomialTerm (symbol, exponent, coeff, explicitCoeff = false) {
    return this.term(symbol, exponent, coeff, explicitCoeff)
  },

  // Given a root value and a radicand (what is under the radical)
  nthRoot (radicandNode, rootNode) {
    if (rootNode && !NodeType.kemuIsConstantInteger(rootNode, 2)) {
      // Root of n degree.
      return new math.FunctionNode(NodeCreator.symbol('nthRoot'), [radicandNode, rootNode])

    } else {
      // Root of 2 degree, fallback to sqrt.
      return new math.FunctionNode(NodeCreator.symbol('sqrt'), [radicandNode])
    }
  },

  kemuCreateAbs(node) {
    const symbol = NodeCreator.symbol('abs')
    return new math.FunctionNode(symbol, [node])
  },

  kemuCreateSqrt(node) {
    const symbol = NodeCreator.symbol('sqrt')
    return new math.FunctionNode(symbol, [node])
  }
}

module.exports = NodeCreator
