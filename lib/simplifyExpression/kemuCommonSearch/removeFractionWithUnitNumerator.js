const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

const NODE_CONST_ONE = Node.Creator.constant(1)

function removeFractionWithUnitNumerator(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '*') {
    const leftNode  = node.args[0]
    const rightNode = node.args[1]

    if ((rightNode.op == '/') &&
        (rightNode.args[0].equals(NODE_CONST_ONE))) {
      // a*1/x gives a/x
      const newNode = Node.Creator.operator('/', [leftNode, clone(rightNode.args[1])])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_FRACTION_WITH_UNIT_NUMERATOR, node, newNode)
    }
  }

  return rv
}

module.exports = removeFractionWithUnitNumerator
