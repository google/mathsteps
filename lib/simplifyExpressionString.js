'use strict';

const math = require('mathjs');
const simplifyExpressionNode = require('./simplifyExpressionNode');

function simplifyExpressionString(expressionString, debug=false) {
  let exprNode;
  try {
    exprNode = math.parse(expressionString);
  }
  catch (err) {
    return [];
  }
  if (exprNode) {
    return simplifyExpressionNode(exprNode, debug);
  }
  return [];
}

module.exports = simplifyExpressionString;
