const {query} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// Helper function to apply a rule or its reverse to the inputNode
// Returns a Node.Status object.
function applyRule(node, rule, changeType, reverse) {
  let newNode = rewriteNode(rule, node);
  if (!newNode) {
    newNode = rewriteNode(reverse, node);
  }
  if (newNode) {
    return Node.Status.nodeChanged(
      changeType, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// e.g. -(-3) -> 3
const RESOLVE_DOUBLE_NEGATION = defineRuleString('--#a', '#a');

const REARRANGE_COEFF = defineRuleString('#b * #a', '#a #b', {a: query.isNumber, b: query.isPolynomialTerm})

// e.g. 2/-1 -> -2
const DIVISION_BY_NEGATIVE_ONE = defineRuleString('#a / -1', '-#a');

// e.g. 2/1 -> 2
const DIVISION_BY_ONE = defineRuleString('#a / 1', '#a');

// e.g. 2 * 0 -> 0
const MULTIPLY_BY_ZERO = defineRuleString('#a', '0', {
  a: node => query.isMul(node)
    && node.args.some(arg => query.getValue(arg) === 0)
});

// e.g. x ^ 0 -> 1
const REMOVE_EXPONENT_BY_ZERO = defineRuleString('#a ^ 0', '1');

// e.g. 0 / x -> 0
const REMOVE_ZERO_NUMERATOR = defineRuleString('0 / #a', '0');

// e.g. 2 + 0 -> 2
const REMOVE_ADDING_ZERO = defineRuleString('#a + 0', '#a');

// e.g. 0 + 2 -> 2
const REMOVE_ADDING_ZERO_REVERSE = defineRuleString('0 + #a', '#a');

// e.g. x ^ 1 -> x
const REMOVE_EXPONENT_BY_ONE = defineRuleString('#a ^ 1', '#a');

// e.g. 1 ^ x -> 1
const REMOVE_EXPONENT_BASE_ONE = defineRuleString('1 ^ #a', '1');

// e.g. x * -1 -> -x
const REMOVE_MULTIPLYING_BY_NEGATIVE_ONE = defineRuleString('#a * -1', '-#a');

// e.g. -1 * x -> -x
const REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE = defineRuleString('-1 * #a', '-#a');

// e.g. x * 1 -> x
const REMOVE_MULTIPLYING_BY_ONE = defineRuleString('#a * 1', '#a');

// e.g. 1 * x -> x
const REMOVE_MULTIPLYING_BY_ONE_REVERSE = defineRuleString('1 * #a', '#a');

module.exports = {
  RESOLVE_DOUBLE_NEGATION,
  DIVISION_BY_ONE,
  REARRANGE_COEFF,
  DIVISION_BY_NEGATIVE_ONE,
  REMOVE_ZERO_NUMERATOR,
  REMOVE_ADDING_ZERO,
  REMOVE_ADDING_ZERO_REVERSE,
  MULTIPLY_BY_ZERO,
  REMOVE_EXPONENT_BASE_ONE,
  REMOVE_EXPONENT_BY_ONE,
  REMOVE_EXPONENT_BY_ZERO,
  REMOVE_MULTIPLYING_BY_ONE,
  REMOVE_MULTIPLYING_BY_ONE_REVERSE,
  REMOVE_MULTIPLYING_BY_NEGATIVE_ONE,
  REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE,
  applyRule
};
