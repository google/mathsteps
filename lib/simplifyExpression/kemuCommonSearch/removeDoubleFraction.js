const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

function removeDoubleFraction(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '/') {
    const left  = node.args[0]
    const right = node.args[1]

    if (left.op == '/') {
      // x/y/z gives x/(y*z)
      const numerator   = clone(left.args[0])
      const denominator = Node.Creator.operator('*', [left.args[1], right])
      const newNode     = Node.Creator.operator('/', [numerator, denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_DOUBLE_FRACTION, node, newNode)
    } else if (Node.Type.isParenthesis(left) &&
            (left.content.op == '/') &&
            (left.content.args.length == 2)) {
      // (x/y)/z gives x/(y*z)
      const numerator   = clone(left.content.args[0])
      const denominator = Node.Creator.operator('*', [left.content.args[1], right])
      const newNode     = Node.Creator.operator('/', [numerator, denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_DOUBLE_FRACTION, node, newNode)
    }
  }

  return rv
}

module.exports = removeDoubleFraction
