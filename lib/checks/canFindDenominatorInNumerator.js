const Node = require('../node');

// Returns true if by adding a term you can simplify part of the function into
// an integer
// e.g. (2x+1)/(2x+3) -> True because of the following simplification
// (2x+1)/(2x+3) -> (2x + 3)/(2x + 3) - 2/(2x + 3) -> 1 - 2/(2x + 3)
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
  if (!(numerator.op === '+' || numerator.op === '-' ||
        denominator.op === '+' || numerator.op === '-')) {
    return false;
  }
  if (denominator.op !== '+') {
    return false;
  }

  let numeratorFirstTerm;
  if (numerator.op === '+') {
    numeratorFirstTerm = new Node.PolynomialTerm(numerator.args[0]);
  }
  else if (numerator.op === '*') {
    numeratorFirstTerm = new Node.PolynomialTerm(numerator);
  }

  let denominatorFirstTerm;
  if (denominator.op === '+') {
    denominatorFirstTerm = new Node.PolynomialTerm(denominator.args[0]);
  }
  else if (denominator.op === '*') {
    denominatorFirstTerm = new Node.PolynomialTerm(denominator);
  }

  if (!(numeratorFirstTerm)) {
    return false;
  }
  if (!(denominatorFirstTerm)) {
    return false;
  }

  if (!(numeratorFirstTerm.getSymbolName() === 'x' && denominatorFirstTerm.getSymbolName() === 'x')) {
    return false;
  }

  return true;
}

module.exports = canFindDenominatorInNumerator;
