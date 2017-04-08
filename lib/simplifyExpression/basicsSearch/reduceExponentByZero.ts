import ChangeTypes = require('../../ChangeTypes');
import mathNode = require('../../mathnode');

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a mathNode.Status object.
function reduceExponentByZero(node: any);
function reduceExponentByZero(node) {
  if (node.op !== '^') {
    return mathNode.Status.noChange(node);
  }
  const exponent = node.args[1];
  if (mathNode.Type.isConstant(exponent) && exponent.value === '0') {
    const newNode = mathNode.Creator.constant(1);
    return mathNode.Status.nodeChanged(
      ChangeTypes.REDUCE_EXPONENT_BY_ZERO, node, newNode);
  }
  else {
    return mathNode.Status.noChange(node);
  }
}

export = reduceExponentByZero;
