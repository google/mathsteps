'use strict';

const MathChangeTypes = require('../MathChangeTypes');
const NodeCreator = require('../util/NodeCreator');
const NodeStatus = require('../util/NodeStatus');

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a NodeStatus object.
function reduceZeroDividedByAnything(node) {
  if (node.op !== '/') {
    return NodeStatus.noChange(node);
  }
  if (node.args[0].value === '0') {
    const newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(
      MathChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

module.exports = reduceZeroDividedByAnything;
