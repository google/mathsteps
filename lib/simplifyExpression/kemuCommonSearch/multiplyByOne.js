const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

const NODE_CONST_ONE = Node.Creator.constant(1)

function multiplyByOne(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '*') {
    const left  = node.args[0]
    const right = node.args[1]

    if (left.equals(NODE_CONST_ONE)) {
      // 1*x gives x
      const newNode = clone(right)
      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_BY_ONE, node, newNode)
    } else if (right.equals(NODE_CONST_ONE)) {
      // x*1 gives x
      const newNode = clone(left)
      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_BY_ONE, node, newNode)
    }
  }

  return rv
}

module.exports = multiplyByOne
