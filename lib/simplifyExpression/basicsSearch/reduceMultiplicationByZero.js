const {build, query} = require('math-nodes');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a Node.Status object.
function reduceMultiplicationByZero(node) {
  // The math-rules rule for this didn't do the right thing when the '0' was
  // in the middle of the args list.
  if (query.isMul(node) && node.args.some(node => query.getValue(node) === 0)) {
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_BY_ZERO, node, build.number('0'));
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceMultiplicationByZero;
