const {build, query} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const checks = require('../../checks');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// e.g. -(-3) -> 3
const NEGATION = defineRuleString('--#a', '#a');

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function negation(node) {
  const newNode = rewriteNode(NEGATION, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.NEGATION, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

//const REARRANGE_COEFF = defineRuleString('#b * #a', '#a #b', {a: query.isNumber, b: isPolynomialTerm})

// e.g. 2/-1 -> -2
const DIVISION_BY_NEGATIVE_ONE = defineRuleString('#a / -1', '-#a');

// e.g. 2/1 -> 2
const DIVISION_BY_ONE = defineRuleString('#a / 1', '#a');


// If `node` is a division operation of something by 1 or -1, we can remove the
// denominator. Returns a Node.Status object.
function removeDivisionByOne(node) {
  let newNode = null;
  newNode = rewriteNode(DIVISION_BY_ONE, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.DIVISION_BY_ONE, node, newNode);
  }

  const numerator = node.args[0];
  if (query.isNeg(numerator)) {
    return negation(build.neg(numerator));
  }

  newNode = rewriteNode(DIVISION_BY_NEGATIVE_ONE, node);

  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.DIVISION_BY_NEGATIVE_ONE, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

const MULTIPLY_BY_ZERO = defineRuleString('#a', '0', {
  a: node => query.isMul(node)
    && node.args.some(arg => query.getValue(arg) === 0),
});

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a Node.Status object.
function removeMultiplicationByZero(node) {
  const newNode = rewriteNode(MULTIPLY_BY_ZERO, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. x ^ 0 -> 1
const REDUCE_EXPONENT_BY_ZERO = defineRuleString('#a ^ 0', '1');

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a Node.Status object.
function removeExponentByZero(node) {
  const newNode = rewriteNode(REDUCE_EXPONENT_BY_ZERO, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.REDUCE_EXPONENT_BY_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. 0 / x -> 0
const REDUCE_ZERO_NUMERATOR = defineRuleString('0 / #a', '0');

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a Node.Status object.
function removeDivisionByZero(node) {
  const newNode = rewriteNode(REDUCE_ZERO_NUMERATOR, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. 2 + 0 -> 2
const REMOVE_ADDING_ZERO = defineRuleString('#a + 0', '#a');

// e.g. 0 + 2 -> 2
const REMOVE_ADDING_ZERO_REVERSE = defineRuleString('0 + #a', '#a');

// If `node` is an addition node with 0 as one of its operands,
// remove 0 from the operands list. Returns a Node.Status object.
function removeAdditionOfZero(node) {
  let newNode = null;
  newNode = rewriteNode(REMOVE_ADDING_ZERO, node);
  if (!newNode) {
    newNode = rewriteNode(REMOVE_ADDING_ZERO_REVERSE, node);
  }
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. x ^ 1 -> x
const REMOVE_EXPONENT_BY_ONE = defineRuleString('#a ^ 1', '#a');

// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a Node.Status object.
function removeExponentByOne(node) {
  const newNode = rewriteNode(REMOVE_EXPONENT_BY_ONE, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BY_ONE, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. 1 ^ x -> 1
const REMOVE_EXPONENT_BASE_ONE = defineRuleString('1 ^ #a', '1');

// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a Node.Status object.
function removeExponentBaseOne(node) {
  const newNode = rewriteNode(REMOVE_EXPONENT_BASE_ONE, node);
  if (newNode && checks.resolvesToConstant(node.args[1])) {
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BASE_ONE, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. x * -1 -> -x
const REMOVE_MULTIPLYING_BY_NEGATIVE_ONE = defineRuleString('#a * -1', '-#a');

// e.g. -1 * x -> -x
const REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE = defineRuleString('-1 * #a', '-#a');

// If `node` is a multiplication node with -1 as one of its operands,
// and a non constant as the next operand, remove -1 from the operands
// list and make the next term have a unary minus.
// Returns a Node.Status object.
function removeMultiplicationByNegativeOne(node) {
  let newNode = null;
  newNode = rewriteNode(REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node);
  if (!newNode) {
    newNode = rewriteNode(REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE, node);
  }
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. x * 1 -> x
const REMOVE_MULTIPLYING_BY_ONE = defineRuleString('#a * 1', '#a');

// e.g. 1 * x -> x
const REMOVE_MULTIPLYING_BY_ONE_REVERSE = defineRuleString('1 * #a', '#a');

// If `node` is a multiplication node with 1 as one of its operands,
// remove 1 from the operands list. Returns a Node.Status object.
function removeMultiplicationByOne(node) {
  let newNode = null;
  newNode = rewriteNode(REMOVE_MULTIPLYING_BY_ONE, node);
  if (!newNode) {
    newNode = rewriteNode(REMOVE_MULTIPLYING_BY_ONE_REVERSE, node);
  }
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_MULTIPLYING_BY_ONE, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = {
  removeDivisionByOne,
  removeDivisionByZero,
  removeAdditionOfZero,
  removeMultiplicationByZero,
  removeExponentBaseOne,
  removeExponentByOne,
  removeExponentByZero,
  removeMultiplicationByNegativeOne,
  removeMultiplicationByOne,
  negation
};
