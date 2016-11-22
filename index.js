const simplifyExpression = require('./simplifyExpression');
const solveEquation = require('./solveEquation');

module.exports = {
  expressionStepper: simplifyExpression.stepThrough,
  equationStepper: solveEquation,
};
