const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

const NODE_CONST_ZERO = Node.Creator.constant(0)

function powToOne(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    const exponent = node.args[1]

    if (exponent.equals(NODE_CONST_ZERO)) {
      // x^0 gives 1
      const newNode = Node.Creator.constant(1)
      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_TO_ZERO, node, newNode)
    }
  }
  return rv
}

module.exports = powToOne
