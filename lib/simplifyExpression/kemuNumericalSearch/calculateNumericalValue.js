const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const math = require('mathjs')

const evaluateHandlersForBuiltInFunctions = {
  // Trigonometry: basic
  sin:  {fn: math.sin,  stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  cos:  {fn: math.cos,  stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  tg:   {fn: math.tan,  stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  ctg:  {fn: math.cot,  stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  asin: {fn: math.asin, stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  acos: {fn: math.acos, stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  atan: {fn: math.atan, stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  acot: {fn: math.acot, stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  // Other
  exp:  {fn: math.exp,  stepId: ChangeTypes.KEMU_FUNCTION_VALUE},
  sqrt: {fn: math.sqrt, stepId: ChangeTypes.KEMU_NUMERICAL_SQRT},
}

function calculateNumericalValue(node) {
  let rv = Node.Status.noChange(node)

  if (Node.Type.isFunction(node) && Node.Type.isConstant(node.args[0])) {
    // One arg function with constant argument: f(const).
    const evaluateHandler = evaluateHandlersForBuiltInFunctions[node.fn.name]

    if (evaluateHandler) {
      const argument = node.args[0].value
      const value    = evaluateHandler.fn(argument)
      const newNode  = Node.Creator.constant(value)

      rv = Node.Status.nodeChanged(evaluateHandler.stepId, node, newNode)
    }
  } else if ((node.op == '/') &&
              Node.Type.isConstant(node.args[0]) &&
              Node.Type.isConstant(node.args[1])) {
    // a / b
    const a       = node.args[0].value
    const b       = node.args[1].value
    const newNode = Node.Creator.constant(math.divide(a, b))

    rv = Node.Status.nodeChanged(ChangeTypes.KEMU_NUMERICAL_DIV, node, newNode)
  }

  return rv
}

module.exports = calculateNumericalValue
