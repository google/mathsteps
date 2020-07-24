const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

function removeUnnededParenthesis(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '*') {
    const leftNode  = node.args[0]
    const rightNode = node.args[1]

    if ((Node.Type.isParenthesis(leftNode)) &&
        (Node.Type.isParenthesis(rightNode)) &&
        (leftNode.content.op == '/') &&
        (leftNode.content.args.length == 2) &&
        (rightNode.content.op == '/') &&
        (rightNode.content.args.length == 2)) {
      // (a/b)*(c/d) gives a/b * c/d
      const newLeftNode  = Node.Creator.operator('/', [leftNode.content.args[0], leftNode.content.args[1]])
      const newRightNode = Node.Creator.operator('/', [rightNode.content.args[0], rightNode.content.args[1]])
      const newNode      = Node.Creator.operator('*', [newLeftNode, newRightNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_UNNEDED_PARENTHESIS, node, newNode)
    } else if ((Node.Type.isParenthesis(rightNode)) &&
             (rightNode.content.op == '/') &&
             (rightNode.content.args.length == 2)) {
      // a*(b/c) gives a*b/c
      const newRightNode = Node.Creator.operator('/', [rightNode.content.args[0], rightNode.content.args[1]])
      const newNode      = Node.Creator.operator('*', [clone(leftNode), newRightNode])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_UNNEDED_PARENTHESIS, node, newNode)
    } else if ((Node.Type.isParenthesis(leftNode)) &&
             (leftNode.content.op == '/') &&
             (leftNode.content.args.length == 2)) {
      // a*(b/c) gives a*b/c
      const newLeftNode = Node.Creator.operator('/', [leftNode.content.args[0], leftNode.content.args[1]])
      const newNode     = Node.Creator.operator('*', [newLeftNode, clone(rightNode)])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_UNNEDED_PARENTHESIS, node, newNode)
    } else if ((Node.Type.isParenthesis(leftNode)) &&
             (leftNode.content.op == '*') &&
             (Node.Type.isParenthesis(rightNode)) &&
             (rightNode.content.op == '*')) {
      // (x*y*z*...)*(a*b*...) gives x*y*z*...*a*b*c*...
      let newArgs = []

      for (let arg of leftNode.content.args) {
        newArgs.push(clone(arg))
      }

      for (let arg of rightNode.content.args) {
        newArgs.push(clone(arg))
      }

      const newNode = Node.Creator.operator('*', newArgs)

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_UNNEDED_PARENTHESIS, node, newNode)

    } else if (Node.Type.isParenthesis(leftNode) && (leftNode.content.op == '*')) {
      // (a*b*...)*x gives a*b*...*x
      let newArgs = []

      for (let arg of leftNode.content.args) {
        newArgs.push(clone(arg))
      }

      newArgs.push(clone(rightNode))

      const newNode = Node.Creator.operator('*', newArgs)

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_UNNEDED_PARENTHESIS, node, newNode)

    } else if (Node.Type.isParenthesis(rightNode) && (rightNode.content.op == '*')) {
      // x*(a*b*...) gives x*a*b*...
      let newArgs = [clone(leftNode)]

      for (let arg of rightNode.content.args) {
        newArgs.push(clone(arg))
      }

      const newNode = Node.Creator.operator('*', newArgs)

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_REMOVE_UNNEDED_PARENTHESIS, node, newNode)
    }
  }

  return rv
}

module.exports = removeUnnededParenthesis
