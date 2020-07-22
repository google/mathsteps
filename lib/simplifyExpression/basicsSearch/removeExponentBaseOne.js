const checks = require('../../checks')

const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a Node.Status object.
function removeExponentBaseOne(node) {
  if (node.op === '^' &&                         // an exponent with
      checks.resolvesToConstant(node.args[1]) && // a power not a symbol and
      Node.Type.isConstant(node.args[0]) &&      // a constant base
      node.args[0].value === '1') {              // of value 1
    const newNode = node.args[0].cloneDeep()
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BASE_ONE, node, newNode)
  }
  return Node.Status.noChange(node)
}

module.exports = removeExponentBaseOne
