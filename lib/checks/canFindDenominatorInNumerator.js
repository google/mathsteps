const Node = require('../node');

// Returns true if by adding a term you can simplify part of the function into
// an integer
// e.g. (2x+1)/(2x+3) -> True because of the following simplification
// (2x+1)/(2x+3) -> (2x + 3)/(2x + 3) - 2/(2x + 3) -> 1 - 2/(2x + 3)
// e.g. (2x+1)/(2x^2 + 3) -> False
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

  let n_args_length;
  // If numerator is '*' op, it signifies a single 'ax', should be assigned a
  // length of 1
  if ('args' in numerator && numerator.op !== '*') {
    n_args_length = numerator.args.length;
  }
  else {
    n_args_length = 1;
  }
  let d_args_length;
  if ('args' in denominator) {
    d_args_length = denominator.args.length;
  }
  else {
    d_args_length = 1;
  }

  // If numerator isn't length 2 or length 1 with a polynomial return false
  if (!(n_args_length === 2)) {
    if (!(n_args_length === 1 || Node.Type.isConstant(numerator))) {
      return false;
    }
  }
  // Function doesn't support denominators with args > 2
  // Tf d_args_length < 2 the normal functionality already covers it
  if (!(d_args_length === 2)) {
    return false;
  }
  if (!(denominator.op === '+' || denominator.op === '-')) {
    return false;
  }
  // Check if numerator's second argument is a constant if numerator has two arguments
  if (n_args_length === 2) {
    if (!(Node.Type.isConstant(numerator.args[1]))) {
      return false;
    }
  }
  // Check if denominator's second argument is a constant
  if (!(Node.Type.isConstant(denominator.args[1]))) {
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
