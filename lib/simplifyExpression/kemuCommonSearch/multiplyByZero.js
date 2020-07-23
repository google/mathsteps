const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

const NODE_CONST_ZERO = Node.Creator.constant(0)

function multiplyByZero(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '*') {
    const left  = node.args[0]
    const right = node.args[1]

    if (left.equals(NODE_CONST_ZERO) || right.equals(NODE_CONST_ZERO)) {
      const newNode = clone(NODE_CONST_ZERO)
      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_BY_ZERO, node, newNode)
    }
  }

  return rv
}

module.exports = multiplyByZero
