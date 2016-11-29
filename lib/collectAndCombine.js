'use strict';

// Collects and combines like terms

const clone = require('clone');

const evaluateArithmetic = require('./evaluateArithmetic');
const evaluateConstantSum = require('./evaluateConstantSum');
const Fraction = require('./Fraction');
const LikeTermCollector = require('./LikeTermCollector');
const MathChangeTypes = require('./MathChangeTypes');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermOperations = require('./PolynomialTermOperations');

const likeTermCollectors = {
  '+': addLikeTerms,
  '*': multiplyLikeTerms
};

// Iterates through the tree looking for like terms to collect and combine.
// Will prioritize deeper expressions. Returns a NodeStatus object.
function collectAndCombineLikeTermsDFS(node) {
  let nodeStatus;

  if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    // Try reducing any of the sub-expressions, to prioritize deeper
    // expressions
    for(let i = 0; i < node.args.length; i++) {
      nodeStatus = collectAndCombineLikeTermsDFS(node.args[i]);
      if (nodeStatus.hasChanged()) {
        return NodeStatus.childChanged(node, nodeStatus, i);
      }
    }
    // If they're all fully reduced, maybe this node can be simplified
    return collectAndCombineLikeTerms(node);
  }
  else if (NodeType.isParenthesis(node)) {
    nodeStatus = collectAndCombineLikeTermsDFS(node.content);
  }
  else if (NodeType.isSymbol(node) || NodeType.isConstant(node)) {
    // we can't simplify this any further
    return NodeStatus.noChange(node);
  }
  else if (NodeType.isUnaryMinus(node)) {
    nodeStatus = collectAndCombineLikeTermsDFS(node.args[0]);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }

  if (nodeStatus.hasChanged()) {
    return NodeStatus.childChanged(node, nodeStatus);
  }
  else {
    return NodeStatus.noChange(node);
  }
};

// Given an operator node, maybe collects and then combines if possible
// e.g. 2x + 4x + y => 6x + y
// e.g. 2x * x^2 * 5x => 10 x^4
function collectAndCombineLikeTerms(node) {
  if (node.op === '+') {
    let status = collectAndCombineOperation(node, '+');
    if (status.hasChanged()) {
      return status;
    }
    // we might also be able to just combine if they're all the same term
    // e.g. 2x + 4x + x (doesn't need collecting)
    return PolynomialTermOperations.addLikeTerms(node);
  }
  else if (node.op === '*') {
    // collect and combine involves there being coefficients pulled the front
    // e.g. 2x * x^2 * 5x => (2*5) * (x * x^2 * x) => ... => 10 x^4
    let status = collectAndCombineOperation(node, '*');
    if (status.hasChanged()) {
      return status;
    }
    // we might also be able to just combine polynomial terms
    // e.g. x * x^2 * x => ... => x^4
    return PolynomialTermOperations.multiplyLikeTermPolynomialNodes(node);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

function collectAndCombineOperation(node, op) {
  const originalNode = node;

  let status = LikeTermCollector.collectLikeTerms(clone(node, false));
  if (!status.hasChanged()) {
    return status;
  }

  // STEP 1: collect like terms, e.g. 2x + 4x^2 + 5x => 4x^2 + (2x + 5x)
  const subSteps = [status];
  // this step's newnode is the next step's old node.
  // so clone and reset change groups
  let oldNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 2: combine like terms for each group that can be added
  for (let i = 0; i < oldNode.args.length; i++) {
    let child = oldNode.args[i];
    // All groups of terms are surrounded by parenthesis
    if (!NodeType.isParenthesis(child)) {
      continue;
    }
    child = child.content;
    let childStatus = likeTermCollectors[op](child);
    if (childStatus.hasChanged()) {
      status = NodeStatus.childChanged(oldNode, childStatus, i);
      subSteps.push(status);
      oldNode = NodeStatus.resetChangeGroups(status.newNode);
    }
  }

  const finalNode = NodeStatus.resetChangeGroups(status.newNode);

  return NodeStatus.nodeChanged(
    MathChangeTypes.COLLECT_AND_COMBINE_LIKE_TERMS,
    originalNode, finalNode, true, subSteps);
}

function addLikeTerms(node) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }

  let status = evaluateConstantSum(node);
  if (status.hasChanged()) {
    return status;
  }
  else {
    return PolynomialTermOperations.addLikeTerms(node);
  }
}

function multiplyLikeTerms(node) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }

  let status = evaluateArithmetic(node);
  if (status.hasChanged()) {
    status.changeType = MathChangeTypes.MULTIPLY_COEFFICIENTS;
    return status;
  }

  status = Fraction.multiplyFractionsDFS(node);
  if (status.hasChanged()) {
    status.changeType = MathChangeTypes.MULTIPLY_COEFFICIENTS;
    return status;
  }

  return PolynomialTermOperations.multiplyLikeTermPolynomialNodes(node);
}

module.exports = collectAndCombineLikeTermsDFS;
