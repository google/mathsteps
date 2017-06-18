const {canApplyRule, applyRule} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// e.g. 2 + 0 -> 2
const REMOVE_ADDING_ZERO = defineRuleString('#a + 0', '#a');

// e.g. 0 + 2 -> 2
const REMOVE_ADDING_ZERO_REVERSE = defineRuleString('0 + #a', '#a');

// If `node` is an addition node with 0 as one of its operands,
// remove 0 from the operands list. Returns a Node.Status object.
function removeAdditionOfZero(node) {
  // TODO(kevinb): merge these two rules together
  if (canApplyRule(REMOVE_ADDING_ZERO, node)) {
    const newNode = applyRule(REMOVE_ADDING_ZERO, node);
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  else if (canApplyRule(REMOVE_ADDING_ZERO_REVERSE, node)) {
    const newNode = applyRule(REMOVE_ADDING_ZERO_REVERSE, node);
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = removeAdditionOfZero;
