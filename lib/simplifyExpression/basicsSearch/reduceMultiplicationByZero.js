const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

const REDUCE_MULTIPLY_BY_ZERO = defineRuleString('#a', '0', {
  a: node => q.isMul(node) && node.args.some(arg => q.getValue(arg) === 0),
});

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a Node.Status object.
function reduceMultiplicationByZero(node) {
  const newNode = rewriteNode(REDUCE_MULTIPLY_BY_ZERO, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceMultiplicationByZero;
