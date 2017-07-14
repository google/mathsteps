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
  // second one can be optionally wrapped in parenthesis
  if (!(Node.Type.isOperator(numerator, '*') && numerator.implicit)) {
    return false;
  }

  const numeratorFirst = numerator.args[0];
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

// Get the whole number part of a mixed number
// e.g. 1 2/3 -> 1
function getWholeNumber(node) {
  if (!isMixedNumber(node)) {
    throw Error('Expected a mixed number');
  }

  return parseInt(node.args[0].args[0].value);
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
  getWholeNumber,
  getNumerator,
  getDenominator
};
