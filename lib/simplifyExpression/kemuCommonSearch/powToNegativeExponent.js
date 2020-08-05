const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')
const math = require('mathjs')

const NODE_CONST_MINUS_ONE = Node.Creator.constant(-1)
const NODE_CONST_ONE       = Node.Creator.constant(1)

function powToNegativeExponent(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    // Possible improvement: Simplify it.
    // Fetch x^y args.
    const base     = node.args[0]
    let   exponent = node.args[1]

    // Skip parenteses around whole exponent if any.
    if (Node.Type.isParenthesis(exponent)) {
      // x^(y) gives x^y
      exponent = exponent.content
    }

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

    } else if (Node.Type.isConstant(exponent) && math.isNegative(exponent.value)) {
      // x^-2 gives 1/(x^2)
      const denominator = Node.Creator.operator('^', [clone(base), Node.Creator.constant(math.multiply(-1, exponent.value))])
      const newNode     = Node.Creator.operator('/', [clone(NODE_CONST_ONE), denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT, node, newNode)

    } else if (Node.Type.isUnaryMinus(exponent)) {
      // x^-a gives 1/(x^a)
      const denominator = Node.Creator.operator('^', [clone(base), clone(exponent.args[0])])
      const newNode     = Node.Creator.operator('/', [clone(NODE_CONST_ONE), denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT, node, newNode)

    } else if ((node.args[1].op === '*') || (node.args[1].op === '/')) {
      // x ^ (a b c ...)
      // x ^ (a / b / c / ...)
      // Search for at least one negative factor in exponent.
      const exponentNode    = node.args[1]
      const exponentFactors = exponentNode.args

      for (let idx = 0; idx < exponentFactors.length; idx++) {
        if (Node.Type.kemuIsConstantNegative(exponentFactors[idx])) {
          // At least one exponent factor is negative:
          //   x ^ (a b c * ... * -n * ... * d e f)
          // gives
          //   1 / (x ^ (a b c ... n ... d e f))
          let   newBase     = null
          let   newNode     = null
          const newExponent = clone(exponentNode)

          // Create new exponent with negated factor.
          newExponent.args[idx] = Node.Creator.constant(math.multiply(-1, exponentFactors[idx].value))

          // Build result node.
          if (base.op === '/') {
            // Fraction base x/y - invert to y/x
            newBase = Node.Creator.operator('/', [clone(base.args[1]), clone(base.args[0])])
            newNode = Node.Creator.operator('^', [newBase, newExponent])

          } else {
            // Non-fraction base x - invert to 1/x.
            newBase = Node.Creator.operator('^', [base, newExponent])
            newNode = Node.Creator.operator('/', [clone(NODE_CONST_ONE), newBase])
          }

          rv = Node.Status.nodeChanged(
            ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT, node, newNode)

          break
        }
      }
    }
  }

  return rv
}

module.exports = powToNegativeExponent
