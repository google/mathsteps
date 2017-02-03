const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a Node.Status object.
function reduceZeroDividedByAnything(node) {
  if (node.op !== '/') {
    return Node.Status.noChange(node);
  }
  if (node.args[0].value === '0') {
    const newNode = Node.Creator.constant(0);
    return Node.Status.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceZeroDividedByAnything;
