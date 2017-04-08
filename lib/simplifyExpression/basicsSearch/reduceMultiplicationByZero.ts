import ChangeTypes = require('../../ChangeTypes');
import mathNode = require('../../mathnode');

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a mathNode.Status object.
function reduceMultiplicationByZero(node: any);
function reduceMultiplicationByZero(node) {
  if (node.op !== '*') {
    return mathNode.Status.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    if (mathNode.Type.isConstant(arg) && arg.value === '0') {
      return true;
    }
    if (mathNode.PolynomialTerm.isPolynomialTerm(arg)) {
      const polyTerm = new mathNode.PolynomialTerm(arg);
      return polyTerm.getCoeffValue() === 0;
    }
    return false;
  });
  if (zeroIndex >= 0) {
    // reduce to just the 0 node
    const newNode = mathNode.Creator.constant(0);
    return mathNode.Status.nodeChanged(
      ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  }
  else {
    return mathNode.Status.noChange(node);
  }
}

export = reduceMultiplicationByZero;
