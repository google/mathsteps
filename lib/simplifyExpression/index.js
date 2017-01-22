'use strict';

const math = require('mathjs');
math.config({number: 'Fraction'});

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
