const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a Node.Status object.
function reduceMultiplicationByZero(node) {
  if (node.op !== '*') {
    return Node.Status.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    if (Node.Type.isConstant(arg) && arg.value === '0') {
      return true;
    }
    if (Node.PolynomialTerm.isPolynomialTerm(arg)) {
      const polyTerm = new Node.PolynomialTerm(arg);
      return polyTerm.getCoeffValue() === 0;
    }
    return false;
  });
  if (zeroIndex >= 0) {
    // reduce to just the 0 node
    const newNode = Node.Creator.constant(0);
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = reduceMultiplicationByZero;
