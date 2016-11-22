const simplifyExpression = require('./lib/simplifyExpression');
const solveEquation = require('./lib/solveEquation');

module.exports = {
  expressionStepper: simplifyExpression.stepThrough,
  equationStepper: solveEquation,
};
