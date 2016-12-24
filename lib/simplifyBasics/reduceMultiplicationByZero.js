'use strict';

const MathChangeTypes = require('../MathChangeTypes');
const NodeCreator = require('../util/NodeCreator');
const NodeStatus = require('../util/NodeStatus');
const NodeType = require('../util/NodeType');
const PolynomialTermNode = require('../PolynomialTermNode');

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a NodeStatus object.
function reduceMultiplicationByZero(node) {
  if (node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    if (NodeType.isConstant(arg) && arg.value === '0') {
      return true;
    }
    if (PolynomialTermNode.isPolynomialTerm(arg)) {
      const polyTerm = new PolynomialTermNode(arg);
      return polyTerm.getCoeffValue() === 0;
    }
    return false;
  });
  if (zeroIndex >= 0) {
    // reduce to just the 0 node
    const newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(
      MathChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

module.exports = reduceMultiplicationByZero;
