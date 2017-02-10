'use strict';

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is a division operation of something by 0, we return
// a special ChangeTypes.DIVISION_BY_ZERO. The function simplifyExpression
// will pick this up and stop processing. Returns a Node.Status object.
function handleDivisionByZero(node) {
  if (node.op !== '/') {
    return Node.Status.noChange(node);
  }
  const denominator = node.args[1];
  if (!Node.Type.isConstant(denominator)) {
    return Node.Status.noChange(node);
  }

  if (parseFloat(denominator.value) === 0) {
    return Node.Status.nodeChanged(
      ChangeTypes.DIVISION_BY_ZERO, node, node);
  }
  else {
    return Node.Status.noChange(node);
  }
}
module.exports = handleDivisionByZero;
