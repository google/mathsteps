const Negative = require('../../Negative');
const Node = require('../../node');

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

  // check for implicit multiplication between two constants in the numerator
  // first can be wrapped in unary minus
  // second one can be optionally wrapped in parenthesis
  if (!(Node.Type.isOperator(numerator, '*') && numerator.implicit)) {
    return false;
  }

  const numeratorFirst = Node.Type.isUnaryMinus(numerator.args[0]) ?
        Negative.negate(numerator.args[0].args[0])
        : numerator.args[0];

  const numeratorSecond = Node.Type.isParenthesis(numerator.args[1]) ?
        numerator.args[1].content
        : numerator.args[1];

  if (!(Node.Type.isConstant(numeratorFirst) &&
        Node.Type.isConstant(numeratorSecond))) {
    return false;
  }

  // check for a constant in the denominator,
  // optionally wrapped in parenthesis
  const denominatorValue = Node.Type.isParenthesis(denominator) ?
        denominator.content
        : denominator;

  if (!Node.Type.isConstant(denominatorValue)) {
    return false;
  }

  return true;
}

// Returns true if the mixed number is negative,
// in which case we have to ignore the negative while converting to an
// improper fraction, and instead we negate the whole thing at the end
// e.g. -1 2/3 !== ((-1 * 3) + 2)/3 = -1/3
//      -1 2/3 == -((1 * 3) + 2)/3 = -5/2
function isNegativeMixedNumber(node) {
  if (!isMixedNumber(node)) {
    throw Error('Expected a mixed number');
  }

  return Node.Type.isUnaryMinus(node.args[0].args[0]);
}

// Get the whole number part of a mixed number
// e.g. 1 2/3 -> 1
// Negatives are ignored; e.g. -1 2/3 -> 1
function getWholeNumber(node) {
  if (!isMixedNumber(node)) {
    throw Error('Expected a mixed number');
  }

  const wholeNumberNode = Node.Type.isUnaryMinus(node.args[0].args[0]) ?
        node.args[0].args[0].args[0]
        : node.args[0].args[0];

  return parseInt(wholeNumberNode.value);
}

// Get the numerator part of a mixed number
// e.g. 1 2/3 -> 2
function getNumerator(node) {
  if (!isMixedNumber(node)) {
    throw Error('Expected a mixed number');
  }

  const numeratorNode = Node.Type.isParenthesis(node.args[0].args[1]) ?
        node.args[0].args[1].content
        : node.args[0].args[1];

  return parseInt(numeratorNode.value);
}

// Get the denominator part of a mixed number
// e.g. 1 2/3 -> 3
function getDenominator(node) {
  if (!isMixedNumber(node)) {
    throw Error('Expected a mixed number');
  }

  const denominatorNode = Node.Type.isParenthesis(node.args[1]) ?
        node.args[1].content
        : node.args[1];

  return parseInt(denominatorNode.value);
}

module.exports = {
  isMixedNumber,
  isNegativeMixedNumber,
  getWholeNumber,
  getNumerator,
  getDenominator
};
