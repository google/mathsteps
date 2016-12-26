const simplifyExpressionNode = require('./lib/simplifyExpressionNode');
const simplifyExpressionString = require('./lib/simplifyExpressionString');
const solveEquation = require('./lib/solveEquation/solveEquation');
const solveEquationString = require('./lib/solveEquation/solveEquationString');
const MathChangeTypes = require('./lib/MathChangeTypes');

module.exports = {
  // TODO: after deploying this and then the update to Athena.
  // remove expressionStepper
  expressionStepper: simplifyExpressionNode,
  simplifyExpressionString: simplifyExpressionString,
  // TODO: after deploying this and then the update to Athena,
  // remove equationStepper
  equationStepper: solveEquation,
  solveEquationString: solveEquationString,
  MathChangeTypes: MathChangeTypes,
};
