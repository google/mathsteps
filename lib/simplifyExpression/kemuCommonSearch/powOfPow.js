const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

function powOfPow(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '^') {
    if ((Node.Type.isParenthesis(node.args[0])) && (node.args[0].content.op == '^')) {
      // (a^x)^y gives a^(x*y)
      const exponentNode = Node.Creator.operator('*', [clone(node.args[1]), clone(node.args[0].content.args[1])])
      const newNode      = Node.Creator.operator('^', [clone(node.args[0].content.args[0]), exponentNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_EXPONENTS, node, newNode)
    } else if (node.args[0].op == '^') {
      // (a^x)^y gives a^(x*y)
      const exponentNode = Node.Creator.operator('*', [clone(node.args[1]), clone(node.args[0].args[1])])
      const newNode      = Node.Creator.operator('^', [clone(node.args[0].args[0]), exponentNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_EXPONENTS, node, newNode)
    }
  }

  return rv
}

module.exports = powOfPow
