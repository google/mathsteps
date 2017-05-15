import {parse} from 'math-parser';
import stepThrough from './stepThrough.js';

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
