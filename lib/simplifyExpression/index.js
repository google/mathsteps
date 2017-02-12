const math = require('mathjs');
const stepThrough = require('./stepThrough');

function simplifyExpressionString(expressionString, debug=false) {
  let exprNode;
  try {
    exprNode = math.parse(expressionString);
  }
  catch (err) {
    return [];
  }
  if (exprNode) {
    return stepThrough(exprNode, debug);
  }
  return [];
}

module.exports = simplifyExpressionString;
