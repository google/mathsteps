const Node = require('../node');

// Returns true if `node` is a mixed number
// e.g. 2 1/2, 19 2/3
// These will be parsed by mathjs as e.g. 2(1)/(2),
// which is division with implicit multiplication in the numerator
function isMixedNumber(node) {
  if (!Node.Type.isOperator(node, '/')) {
    return false;
  }

  if (node.args.length !== 2) {
    return false;
  }

  const numerator = node.args[0];
  const denominator = node.args[1];

  // check for implicit multiplication between a constant and a parens node
  // wrapped around a constant in the numerator
  if (!(Node.Type.isOperator(numerator, '*') && numerator.implicit)) {
    return false;
  }

  const numeratorConstant = numerator.args[0]
  const numeratorParens = numerator.args[1]

  if (!(Node.Type.isConstant(numeratorConstant) && Node.Type.isParenthesis(numeratorParens))) {
    return false;
  }

  const numeratorParensContent = numeratorParens.content
  if (!Node.Type.isConstant(numeratorParensContent)) {
    return false;
  }

  // check for a parents node wrapped around a constant in the denominator
  if (!(Node.Type.isParenthesis(denominator))) {
    return false;
  }

  const denominatorParensContent = denominator.content
  if (!Node.Type.isConstant(denominatorParensContent)) {
    return false;
  }

  return true
}

module.exports = isMixedNumber;
