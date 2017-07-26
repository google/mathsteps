const math = require('mathjs');
const stepThrough = require('./stepThrough');
const Substitute = require('../Substitute');

function simplifyExpressionString(expressionString, debug=false, scope={}) {
  const newScope = Substitute(scope);
  let exprNode;
  try {
    exprNode = math.parse(expressionString);
  }
  catch (err) {
    return [];
  }
  if (exprNode) {
    return stepThrough(exprNode, debug, newScope);
  }
  return [];
}

module.exports = simplifyExpressionString;
