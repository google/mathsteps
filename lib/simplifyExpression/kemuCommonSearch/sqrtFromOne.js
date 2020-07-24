const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')
const math = require('mathjs')

const NODE_CONST_ONE = Node.Creator.constant(1)

function sqrtFromOne(node) {
  let rv = Node.Status.noChange(node)

  if (Node.Type.isFunction(node, 'sqrt')) {
    const radicand = node.args[0]

    if ((radicand.op == '/') &&
        (radicand.args[0].equals(NODE_CONST_ONE))) {
      // sqrt(1/x) gives 1 / sqrt(x)
      const functionSymbol = Node.Creator.symbol('sqrt')
      const numerator      = clone(NODE_CONST_ONE)
      const denominator    = new math.FunctionNode(functionSymbol, [clone(radicand.args[1])])
      const newNode        = Node.Creator.operator('/', [numerator, denominator])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_SQRT_FROM_ONE, node, newNode)
    }
  }

  return rv
}

module.exports = sqrtFromOne
