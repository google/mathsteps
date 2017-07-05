const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const {parse} = require('math-parser');
const {build, query} = require('math-nodes');

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a Node.Status object.
function reduceExponentByZero(node) {
  if (!query.isPow(node)) {
    return Node.Status.noChange(node);
  }
  const exponent = node.args[1];
  if (query.isNumber(exponent) && exponent.value === '0') {
    const newNode = build.number(1);
    return Node.Status.nodeChanged(
      ChangeTypes.REDUCE_EXPONENT_BY_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceExponentByZero;
