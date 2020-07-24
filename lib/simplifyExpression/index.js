const math = require('mathjs')
const stepThrough = require('./stepThrough')

function simplifyExpressionString(expressionString, debug = false, expressionCtx = null) {
  let exprNode
  try {
    exprNode = math.parse(expressionString)
  } catch (err) {
    return []
  }
  if (exprNode) {
    return stepThrough(exprNode, debug, expressionCtx)
  }
  return []
}

module.exports = simplifyExpressionString
