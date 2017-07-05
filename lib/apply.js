const {rewriteNode} = require('math-rules');
const Node = require('./node');

function apply(node, rule, changeType, reverse) {
  let newNode = rewriteNode(rule, node);
  if (newNode) {
    return Node.Status.nodeChanged(
      changeType, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = {apply}
