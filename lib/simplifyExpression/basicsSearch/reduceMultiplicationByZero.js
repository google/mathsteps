const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

const {build, query} = require('math-nodes');

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a Node.Status object.
function reduceMultiplicationByZero(node) {
  if (!query.isMul(node)) {
    return Node.Status.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    if (query.isNumber(arg) && query.getValue(arg) === 0) {
      return true;
    }
    if (query.isPolynomialTerm(arg)) {
      const polyTerm = clone(arg);
      return query.getValue(query.getCoefficient(polyTerm)) === 0;
    }
    return false;
  });
  if (zeroIndex >= 0) {
    // reduce to just the 0 node
    const newNode = build.number(0);
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceMultiplicationByZero;
