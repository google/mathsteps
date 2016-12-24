const simplifyExpressionNode = require('./lib/simplifyExpressionNode');
const simplifyExpressionString = require('./lib/simplifyExpressionString');
const solveEquation = require('./lib/solveEquation/solveEquation');
const solveEquationString = require('./lib/solveEquation/solveEquationString');

module.exports = {
  // TODO: update Athena to use solveExpressionString and remove expressionStepper
  expressionStepper: simplifyExpressionNode,
  simplifyExpressionString: simplifyExpressionString,
  // TODO: update Athena to use solveEquation and remove equationStepper
  equationStepper: solveEquation,
  solveEquationString: solveEquationString,
};
