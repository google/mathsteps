const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

const {build, query} = require('math-nodes');

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a Node.Status object.
function reduceZeroDividedByAnything(node) {
  if (!query.isDiv(node)) {
    return Node.Status.noChange(node);
  }
  if (query.getValue(node.args[0]) === 0) {
    const newNode = build.number(0);
    return Node.Status.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceZeroDividedByAnything;
