const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

function powFactors(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    let radicandNode = node.args[0]
    let exponentNode = node.args[1]

    if (Node.Type.isParenthesis(radicandNode)) {
      // (...)^x
      if (radicandNode.content.op == '*') {
        // (a*b*c*...)^x gives a^x * b^x * c^x *...
        const newNode = clone(radicandNode.content)

        for (let idx = 0; idx < newNode.args.length; idx++) {
          newNode.args[idx] = Node.Creator.operator('^', [newNode.args[idx], exponentNode])
        }

        rv = Node.Status.nodeChanged(
          ChangeTypes.KEMU_POWER_FACTORS, node, newNode)
      }
    } else if ((radicandNode.op == '*') &&
             (radicandNode.implicit) &&
             (radicandNode.args.length == 2) &&
             (Node.Type.isConstant(radicandNode.args[0]))) {
      // (2x)^a gives (2^a * x^a)
      let newArgs = []

      for (let idx = 0; idx < radicandNode.args.length; idx++) {
        newArgs[idx] = Node.Creator.operator('^', [radicandNode.args[idx], exponentNode])
      }

      const newNode = Node.Creator.parenthesis(Node.Creator.operator('*', newArgs))

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_POWER_FACTORS, node, newNode)
    }
  }
  return rv
}

module.exports = powFactors
