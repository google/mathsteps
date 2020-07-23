const math = require('mathjs')

const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

// Converts a decimal number to fraction
// e.g. 3.14 -> 314/100
function convertDecimalToFraction(node, expressionCtx) {
  let rv = Node.Status.noChange(node)

  const isNumericalMode = expressionCtx
    ? expressionCtx.isNumerical()
    : false

  if (!isNumericalMode &&
      Node.Type.isConstant(node) &&
      math.isNumeric(node.value) &&
      !math.isInteger(node.value)) {

    // Node is non-integer constant e.g. 3.14.
    const fractionValues  = node.value.toFraction()
    const numeratorNode   = Node.Creator.constant(fractionValues[0])
    const denominatorNode = Node.Creator.constant(fractionValues[1])

    const newNode = Node.Creator.operator('/', [numeratorNode, denominatorNode])

    rv = Node.Status.nodeChanged(ChangeTypes.KEMU_DECIMAL_TO_FRACTION, node, newNode)
  }

  return rv
}

module.exports = convertDecimalToFraction
