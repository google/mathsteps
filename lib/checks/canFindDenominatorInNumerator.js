const Node = require('../node');

// Returns true if by adding a term you can simplify part of the function into
// an integer
// e.g. (2x+1)/(2x+3) -> True because of the following simplification
// (2x+1)/(2x+3) -> (2x + 3)/(2x + 3) - 2/(2x + 3) -> 1 - 2/(2x + 3)
// e.g. (2x+1)/(2x^2 + 3) -> False
// ==============================================================================
// CHECKS
// - Check for division in parent node
// - Numerator has to be addition/subtraction of a polynomial term to the power
//   of 1 and a constant term, in that order OR a polynomial term to the
//   power of 1
// - Denominator has to be addition/subtraction of a polynomial term to the power
//   of 1 and a constant term, in that order.
// - Check to see that the denominator and numerator have the same symbol

function canFindDenominatorInNumerator(node) {
  if (node.op !== '/' ) {
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

  let numeratorArgsLength;
  // If numerator has args, but it's just a polynomial term, length is 1
  // Ex. 3x/2x+3 => numeratorArgsLength=1
  if (Node.PolynomialTerm.isPolynomialTerm(numerator)) {
    numeratorArgsLength = 1;
  }
  // If numerator has args and args are two seperate values length is 2
  // Ex. 3x+4/2x+3 => numeratorArgsLength=2
  else if (numerator.op === '+' || numerator.op === '-') {
    numeratorArgsLength = numerator.args.length;
  }
  // If numerator doesn't have args and isn't a polynomial term, there's
  // nothing the added functionality can do
  // Ex. 3/(2x + 3) => False
  else {
    return false;
  }
  let denominatorArgsLength;
  if (denominator.op === '+' || denominator.op === '-') {
    denominatorArgsLength = denominator.args.length;
  }
  // If denominator doesn't have args, it's length is 1. This case is already
  // resolved by splitting the denominator into all the numerators
  // Ex. (x + 3)/2x => x/2x + 3/2x
  else {
    return false;
  }
  // Function doesn't support denominators with args > 2
  if (denominatorArgsLength !== 2) {
    return false;
  }
  // Check if numerator's second argument is a constant if numerator has two arguments
  if (numeratorArgsLength === 2) {
    if (!Node.Type.isConstant(numerator.args[1])) {
      return false;
    }
  }
  // Check if denominator's second argument is a constant
  if (!Node.Type.isConstant(denominator.args[1])) {
    return false;
  }
  // Defines the first term depending on whether there's a coefficient value
  // with the first term
  let numeratorFirstTerm;
  if (numerator.op === '+') {
    numeratorFirstTerm = new Node.PolynomialTerm(numerator.args[0]);
  }
  else {
    numeratorFirstTerm = new Node.PolynomialTerm(numerator);
  }
  let denominatorFirstTerm;
  if (denominator.op === '+') {
    denominatorFirstTerm = new Node.PolynomialTerm(denominator.args[0]);
  }
  // If an exponent exists (aka not x^1), return false
  if (numeratorFirstTerm.getExponentNode() ||
      denominatorFirstTerm.getExponentNode()) {
    return false;
  }
  // Check that the symbols are the same, Ex. (x+1)/(y+1) would not pass
  if (!(numeratorFirstTerm.getSymbolName() ===
        denominatorFirstTerm.getSymbolName())) {
    return false;
  }
  return true;
}

module.exports = canFindDenominatorInNumerator;
