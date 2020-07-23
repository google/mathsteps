const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')
const math = require('mathjs')

function simplifyDoubleUnaryMinus(node) {
  let rv = Node.Status.noChange(node)

  if (Node.Type.isUnaryMinus(node)) {
    if (node.args[0].op === '*') {
      // Propagate unary minus to product.
      const args   = node.args[0].args
      let   newArg = null

      for (let idx = 0; idx < args.length; idx++) {
        if (Node.Type.kemuIsConstantNegative(args[idx])) {
          // One of product arguments is negative.
          // - (a -b c) gives (a b c)
          // Cancel minus sign.
          newArg = Node.Creator.constant(math.multiply(-1, args[idx].value))

        } else if (Node.Type.isUnaryMinus(args[idx])) {
          // One of product argument is wrapped into unary minus.
          // - (a -b c) gives (a b c)
          // Remove unary minus.
          newArg = clone(args[idx].args[0])
        }

        if (newArg) {
          // Unary minus matched with one of product argument.
          // Replace this one argument and don't go anymore.
          const newArgs = []

          // Possible improvement: Avoid cloning current one argument.
          args.forEach((sourceArg) => {
            newArgs.push(clone(sourceArg))
          })

          newArgs[idx] = newArg

          const newNode = Node.Creator.operator('*', newArgs, node.args[0].implicit)

          rv = Node.Status.nodeChanged(
            ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node, newNode)

          break
        }
      }
    }
  }
  return rv
}

module.exports = simplifyDoubleUnaryMinus
