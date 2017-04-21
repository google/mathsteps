const Node = require('../node');

// Returns true if by adding a term you can simplify part of the function into an integer
// e.g. (2x+1)/(2x+3) -> True
// e.g. (2x+1)/(2x^2 + 3) -> False
function canFindDenominatorInNumerator(node) {
  if (!Node.Type.isOperator(node) || node.op !== '/' ) {
    return false;
  }
  if (node.args.length !== 2) {
    return false;
  }

  let numerator = node.args[0];
  let denominator = node.args[1];
  if (Node.Type.isParenthesis(numerator)) {
    numerator = numerator.content;
  }
  if (Node.Type.isParenthesis(denominator)) {
    denominator = denominator.content;
  }

  if (numerator.op !== '+') {
    return false;
  }
  if (!('args' in denominator)) {
    return false;
  }
  const numeratorFirstTerm = new Node.PolynomialTerm(numerator.args[0]);
  const denominatorFirstTerm = new Node.PolynomialTerm(denominator.args[0]);

  return numeratorFirstTerm.getSymbolName() === denominatorFirstTerm.getSymbolName();
}

module.exports = canFindDenominatorInNumerator;
