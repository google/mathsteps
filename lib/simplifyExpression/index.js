const math = require('mathjs');
const stepThrough = require('./stepThrough');

function simplifyExpressionString(expressionString, debug=false, scope={}) {
  let exprNode;
  try {
    exprNode = math.parse(expressionString);
  }
  catch (err) {
    return [];
  }
  if (exprNode) {
    return stepThrough(exprNode, debug, scope);
  }
  return [];
}

module.exports = simplifyExpressionString;
