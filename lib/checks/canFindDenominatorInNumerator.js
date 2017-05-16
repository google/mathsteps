const Node = require('../node');

// Returns true if by adding a term you can simplify part of the function into
// an integer
// e.g. (2x+1)/(2x+3) -> True because of the following simplification
// (2x+1)/(2x+3) -> (2x + 3)/(2x + 3) - 2/(2x + 3) -> 1 - 2/(2x + 3)
// e.g. (2x+1)/(2x^2 + 3) -> False
// =========================================================================
// CHECKS
// - Check for division in parent node
// - Check that the number of arguments in parent node is 2
// - Check that the number of numerator args is equal to 2 or 1. In the case
// - of 1, we need that node to have a symbol (so it can't be a constant)
// - Check that denominator has two args
// - Check that the denominator op is '+' or '-'
// - If the numerator has 2 args, check that the second arg is a constant node
// - Check if the denominator's second arg is a constant node
// - Check to see that the denominator and numerator both don't have exponents
// - Check to see that the denominator and numerator have the same symbol

function canFindDenominatorInNumerator(node) {
  if (node.op !== '/' ) {
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

  let numeratorArgsLength;
  // If numerator is '*' op, it signifies a single 'ax', should be assigned a
  // length of 2
  if ('args' in numerator &&
      (numerator.op === '+' || numerator.op === '-')) {
    numeratorArgsLength = numerator.args.length;
  }
  else {
    numeratorArgsLength = 1;
  }
  let denominatorArgsLength;
  if ('args' in denominator) {
    denominatorArgsLength = denominator.args.length;
  }
  else {
    denominatorArgsLength = 1;
  }
  // If numerator args isn't length 2 or length 1 with a polynomial return false
  if (numeratorArgsLength !== 2 &&
     (!(numeratorArgsLength === 1 && !Node.Type.isConstant(numerator)))) {
    return false;
  }
  // Function doesn't support denominators with args > 2
  // If denominatorArgsLength = 1 the normal functionality already covers it
  if (denominatorArgsLength !== 2) {
    return false;
  }
  if (!(denominator.op === '+' || denominator.op === '-')) {
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
