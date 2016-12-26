const simplifyExpressionNode = require('./lib/simplifyExpressionNode');
const simplifyExpressionString = require('./lib/simplifyExpressionString');
const solveEquation = require('./lib/solveEquation/solveEquation');
const solveEquationString = require('./lib/solveEquation/solveEquationString');
const MathChangeTypes = require('./lib/MathChangeTypes');

module.exports = {
  simplifyExpressionString: simplifyExpressionString,
  solveEquationString: solveEquationString,
  MathChangeTypes: MathChangeTypes,
};
