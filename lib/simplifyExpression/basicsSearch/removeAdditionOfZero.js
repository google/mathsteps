const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

const {rules, canApplyRule, applyRule} = require('math-rules');

// If `node` is an addition node with 0 as one of its operands,
// remove 0 from the operands list. Returns a Node.Status object.
function removeAdditionOfZero(node) {
  // TODO(kevinb): merge these two rules together
  if (canApplyRule(rules.REMOVE_ADDING_ZERO, node)) {
    const newNode = applyRule(rules.REMOVE_ADDING_ZERO, node);
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  else if (canApplyRule(rules.REMOVE_ADDING_ZERO_REVERSE, node)) {
    const newNode = applyRule(rules.REMOVE_ADDING_ZERO_REVERSE, node);
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = removeAdditionOfZero;
