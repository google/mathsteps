import ChangeTypes = require('../../ChangeTypes');
import mathNode = require('../../mathnode');

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a mathNode.Status object.
function reduceZeroDividedByAnything(node: any);
function reduceZeroDividedByAnything(node) {
  if (node.op !== '/') {
    return mathNode.Status.noChange(node);
  }
  if (node.args[0].value === '0') {
    const newNode = mathNode.Creator.constant(0);
    return mathNode.Status.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }
  else {
    return mathNode.Status.noChange(node);
  }
}

export = reduceZeroDividedByAnything;
