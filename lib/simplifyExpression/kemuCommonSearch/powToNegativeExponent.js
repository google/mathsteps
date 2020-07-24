const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')
const math = require('mathjs')

const NODE_CONST_MINUS_ONE = Node.Creator.constant(-1)
const NODE_CONST_ONE       = Node.Creator.constant(1)

function powToNegativeExponent(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    const base          = node.args[0]
    const exponent      = node.args[1]
    const exponentValue = exponent.value

    if (exponent.equals(NODE_CONST_MINUS_ONE)) {
      if (base.op == '/') {
        // a/b^-1 gives b/a
        const newNode = Node.Creator.operator('/', [clone(base.args[1]), clone(base.args[0])])

        rv = Node.Status.nodeChanged(
          ChangeTypes.KEMU_POWER_TO_MINUS_ONE, node, newNode)

      } else if (Node.Type.isParenthesis(base) && (base.content.op == '/')) {
        // (a/b)^-1 gives b/a
        const newNode = Node.Creator.operator('/', [clone(base.content.args[1]), clone(base.content.args[0])])

        rv = Node.Status.nodeChanged(
          ChangeTypes.KEMU_POWER_TO_MINUS_ONE, node, newNode)

      } else {
        // x^-1 gives 1/x
        const newNode = Node.Creator.operator('/', [clone(NODE_CONST_ONE), clone(base)])

        rv = Node.Status.nodeChanged(
          ChangeTypes.KEMU_POWER_TO_MINUS_ONE, node, newNode)
      }

    } else if (Node.Type.isConstant(exponent) && math.isNegative(exponentValue)) {
      // x^-2 gives 1/(x^2)
      const denominator = Node.Creator.operator('^', [clone(base), Node.Creator.constant(math.multiply(-1, exponentValue))])
      const newNode     = Node.Creator.operator('/', [clone(NODE_CONST_ONE), denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT, node, newNode)

    } else if (Node.Type.isUnaryMinus(exponent)) {
      // x^-a gives 1/(x^a)
      const denominator = Node.Creator.operator('^', [clone(base), clone(exponent.args[0])])
      const newNode     = Node.Creator.operator('/', [clone(NODE_CONST_ONE), denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT, node, newNode)
    }
  }
  return rv
}

module.exports = powToNegativeExponent
