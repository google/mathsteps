const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')
const math  = require('mathjs')

function _pow(base, exponent) {

  if (base.op === '^') {
    // x^n^z gives x^(n*z)
    const n = base.args[1]

    if (Node.Type.isConstant(exponent) && Node.Type.isConstant(n)) {
      // Both old and new exponents are constants.
      // Calculate result immediately.
      exponent = Node.Creator.constant(math.multiply(n.value, exponent.value))

    } else {
      // Default scenario.
      // Keep a*b multiply in exponent.
      exponent = Node.Creator.operator('*', [base.args[1], exponent])
    }

    base = base.args[0]
  }

  return Node.Creator.operator('^', [base, exponent])
}

function powFactors(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    let radicandNode = node.args[0]
    let exponentNode = node.args[1]

    // Skip parenteses around whole base if any.
    if (Node.Type.isParenthesis(radicandNode)) {
      // x^(y) gives x^y
      radicandNode = radicandNode.content
    }

    if (radicandNode.op == '*') {
      // (a*b*c*...)^n gives (a^n * b^n * c^n * ...)
      let newArgs = []

      for (let idx = 0; idx < radicandNode.args.length; idx++) {
        newArgs[idx] = _pow(radicandNode.args[idx], exponentNode)
      }

      const newNode = Node.Creator.parenthesis(Node.Creator.operator('*', newArgs, radicandNode.implicit))

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_FACTORS, node, newNode)
    }
  }

  return rv
}

module.exports = powFactors
