const math = require('mathjs');
const stepThrough = require('./stepThrough');
const Substitute = require('../substituteScope');

function simplifyExpressionString(expressionString, options={}, debug=false) {
  const newOptions = Object.assign({}, options);
  const newScope = Substitute(options.scope);
  newOptions.scope = newScope;

  let exprNode;
  try {
    exprNode = math.parse(expressionString);
  }
  catch (err) {
    return [];
  }
  if (exprNode) {
    return stepThrough(exprNode, newOptions, debug);
  }
  return [];
}

module.exports = simplifyExpressionString;
