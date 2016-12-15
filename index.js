const simplifyExpression = require('./lib/simplifyExpression');
const solveEquation = require('./lib/solveEquation/solveEquation');

module.exports = {
  expressionStepper: simplifyExpression.stepThrough,
  equationStepper: solveEquation,
};
