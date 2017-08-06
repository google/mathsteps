const {parse} = require('math-parser');
const stepThrough = require('./stepThrough');

function simplifyExpressionString(expressionString, debug=false) {
  let exprNode;
  try {
    exprNode = parse(expressionString);
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
