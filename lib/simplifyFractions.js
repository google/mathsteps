'use strict';

/*
 * Performs simpifications on fractions: adding and cancelling out.
 */

const cancelLikeTerms = require('./cancelLikeTerms');
const ConstantFraction = require('./ConstantFraction');
const Fraction = require('./Fraction');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermOperations = require('./PolynomialTermOperations');

const SIMPLIFICATION_FUNCTIONS = [
  // e.g. 2/3 + 5/6
  ConstantFraction.addConstantFractions,
  // e.g. 4 + 5/6 or 4.5 + 6/8
  ConstantFraction.addConstantAndFraction,
  // e.g. 8/12  ->  2/3 (divide by GCD 4)
  ConstantFraction.divideByGCD,
  // e.g. 2x/4 -> x/2 (divideByGCD but for coefficients of polynomial terms)
  PolynomialTermOperations.simplifyPolynomialFraction,
  // e.g. 2/-9  ->  -2/9      e.g. -2/-9  ->  2/9
  Fraction.simplifySigns,
  // e.g. (2x * 5) / 2x  ->  5
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
    if (innerNodeStatus.hasChanged()) {
      return NodeStatus.childChanged(node, innerNodeStatus);
    }
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = simplifyFractionsDFS(node.args[0]);
    if (innerNodeStatus.hasChanged()) {
      return NodeStatus.childChanged(node, innerNodeStatus);
    }
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

  return NodeStatus.noChange(node);
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
