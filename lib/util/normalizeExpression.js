const print = require('./print')
const math  = require('mathjs')

function normalizeExpression(expressionString) {
  let rv = '[?]'

  try {
    let expressionNode = math.parse(expressionString)
    rv = print.ascii(expressionNode)
  } catch (err) {
    rv = '[error]'
  }

  return rv
}

module.exports = normalizeExpression
