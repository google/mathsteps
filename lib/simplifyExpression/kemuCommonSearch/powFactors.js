const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

function powFactors(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    let radicandNode = node.args[0]
    let exponentNode = node.args[1]

    // Skip parenteses around whole base if any.
    if (Node.Type.isParenthesis(radicandNode)) {
      // x^(y) gives x^y
      radicandNode = radicandNode.content
    }

    if (radicandNode.op == '*') {
      // (a*b*c*...)^n gives (a^n * b^n * c^n * ...)
      let newArgs = []

      for (let idx = 0; idx < radicandNode.args.length; idx++) {
        newArgs[idx] = Node.Creator.operator('^', [radicandNode.args[idx], exponentNode])
      }

      const newNode = Node.Creator.parenthesis(Node.Creator.operator('*', newArgs, radicandNode.implicit))

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_FACTORS, node, newNode)
    }
  }

  return rv
}

module.exports = powFactors
