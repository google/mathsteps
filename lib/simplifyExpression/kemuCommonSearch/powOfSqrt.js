const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

const NODE_CONST_TWO = Node.Creator.constant(2)

function powOfSqrt(node) {
  let rv = Node.Status.noChange(node)

  if ((node.op == '^') &&
      (Node.Type.isFunction(node.args[0], 'sqrt'))) {
    let radicandNode = node.args[0].args[0]
    let exponentNode = node.args[1]

    if (exponentNode.equals(NODE_CONST_TWO)) {
      // sqrt(a)^2 gives a
      const newNode = clone(radicandNode)

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_SQRT, node, newNode)
    } else {
      // sqrt(a)^b gives a^(b/2)
      const newExponentNode = Node.Creator.operator('/', [clone(exponentNode), NODE_CONST_TWO])
      const newNode         = Node.Creator.operator('^', [clone(radicandNode), newExponentNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_SQRT, node, newNode)
    }

  }
  return rv
}

module.exports = powOfSqrt
