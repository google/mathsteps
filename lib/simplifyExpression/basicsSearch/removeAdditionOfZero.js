const {rewriteNode} = require('math-rules');

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

module.exports = removeAdditionOfZero;
