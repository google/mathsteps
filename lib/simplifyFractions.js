'use strict';

/*
 * Performs simpifications on fractions: adding and cancelling out.
 */

const cancelLikeTerms = require('./cancelLikeTerms');
const ConstantFraction = require('./ConstantFraction');
const Fraction = require('./Fraction');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

const SIMPLIFICATION_FUNCTIONS = [
  ConstantFraction.addConstantFractions,
  ConstantFraction.addConstantAndFraction,
  // e.g. 8/12 -> 2/3 (divide by GCF)
  // TODO: rename to divide by GCF and do the sign stuff in a different function
  Fraction.simplifyFraction,
  // e.g. (2x * 5) / 2x -> 5
  cancelLikeTerms,
];

function simplifyFractionsDFS(node) {
  // Try to simplify at this level in the tree
  const nodeStatus = simplifyFractions(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }

  // Now recurse on deeper nodes.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = simplifyFractionsDFS(node.content);
    // always update content, since there might be changes that don't count
    // as a step
    node.content = innerNodeStatus.newNode;
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = simplifyFractionsDFS(node.args[0]);
    // always update arg, since there might be changes that don't count
    // as a step
    node.args[0] = innerNodeStatus.newNode;
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = simplifyFractionsDFS(node.args[i]);
      // always update args, since some changes don't count as a step
      node.args[i] = innerNodeStatus.newNode;
      if (innerNodeStatus.hasChanged()) {
        return NodeStatus.childChanged(node, innerNodeStatus, i);
      }
    }
  }
  else if (NodeType.isSymbol(node) || NodeType.isConstant(node)) {
    // we can't simplify any further
    return NodeStatus.noChange(node);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }

  // If recursing already performed a step, return with that step.
  // Otherwise try simplifying at this level.
  if (innerNodeStatus.hasChanged()) {
    return NodeStatus.childChanged(node, innerNodeStatus);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// Look for step(s) to perform on a node. Returns a NodeStatus object.
function simplifyFractions(node) {
  for (let i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
    let nodeStatus = SIMPLIFICATION_FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    else {
      node = nodeStatus.newNode;
    }
  }
  return NodeStatus.noChange(node);
}


module.exports = simplifyFractionsDFS;
