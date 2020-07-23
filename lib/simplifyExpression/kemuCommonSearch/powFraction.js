const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

function sqrtMultiplication(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    let radicandNode = node.args[0]
    let exponentNode = node.args[1]

    if (Node.Type.isParenthesis(radicandNode) && radicandNode.content.op == '/') {
      // (a/b)^x gives a^x / b^x
      const numeratorNode   = Node.Creator.operator('^', [radicandNode.content.args[0], exponentNode])
      const denominatorNode = Node.Creator.operator('^', [radicandNode.content.args[1], exponentNode])
      const newNode         = Node.Creator.operator('/', [numeratorNode, denominatorNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_FRACTION, node, newNode)
    } else if (radicandNode.op == '/') {
      // (a/b)^x gives a^x / b^x
      const numeratorNode   = Node.Creator.operator('^', [radicandNode.args[0], exponentNode])
      const denominatorNode = Node.Creator.operator('^', [radicandNode.args[1], exponentNode])
      const newNode         = Node.Creator.operator('/', [numeratorNode, denominatorNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_FRACTION, node, newNode)
    }

  }
  return rv
}

module.exports = sqrtMultiplication
