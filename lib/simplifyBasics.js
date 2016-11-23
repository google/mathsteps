'use strict';

/*
 * Performs simpifications that are more basic and overaching like (...)^0 => 1
 * These are always the first simplifications that are attempted.
 */
const clone = require('clone');

const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const print = require('./print');

const SIMPLIFICATION_FUNCTIONS = [
  // multiplication by 0 yields 0
  reduceMultiplicationByZero,
  // division of 0 by something yields 0
  reduceZeroDivdedByAnything,
  // ____^0 --> 1
  reduceExponentByZero,
  // Check for x^1 which should be reduced to x
  removeExponentByOne,
  // - - becomes +
  simplifyDoubleUnaryMinus,
  // If this is a + node and one of the operands is 0, get rid of the 0
  removeAdditionOfZero,
  // If this is a * node and one of the operands is 1, get rid of the 1
  removeMultiplicationByOne,
  // In some cases, remove multiplying by -1
  removeMultiplicationByNegativeOne,
  // If this is a / node and the denominator is 1 or -1, get rid of it
  removeDivisionByOne,
];

function simplifyBasicsDFS(node) {
  const nodeStatus = simplifyBasics(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }

  // Now recurse on deeper nodes.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = simplifyBasicsDFS(node.content);
    // always update content, since there might be changes that don't count
    // as a step
    node.content = innerNodeStatus.newNode;
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = simplifyBasicsDFS(node.args[0]);
    // always update arg, since there might be changes that don't count
    // as a step
    node.args[0] = innerNodeStatus.newNode;
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = simplifyBasicsDFS(node.args[i]);
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
function simplifyBasics(node) {
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

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node) {
  if (!NodeType.isUnaryMinus(node)) {
    return NodeStatus.noChange(node);
  }
  const oldNode = node;
  const unaryArg = node.args[0];
  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (NodeType.isUnaryMinus(unaryArg)) {
    const newNode = clone(unaryArg.args[0], false);
    return NodeStatus.nodeChanged(
      MathChangeTypes.RESOLVE_DOUBLE_MINUS, oldNode, newNode);
  }
  // e.g. - -4, -4 could be a constant with negative value
  else if (NodeType.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
    const newNode = NodeCreator.constant(parseFloat(unaryArg.value) * -1);
    return NodeStatus.nodeChanged(
      MathChangeTypes.RESOLVE_DOUBLE_MINUS, oldNode, newNode);
  }
  // e.g. -(-(5+2))
  else if (NodeType.isParenthesis(unaryArg)) {
    let parenthesisNode = unaryArg;
    const parenthesisContent = parenthesisNode.content;
    if (NodeType.isUnaryMinus(parenthesisContent)) {
      const newNode = NodeCreator.parenthesis(parenthesisContent.args[0]);
      return NodeStatus.nodeChanged(
        MathChangeTypes.RESOLVE_DOUBLE_MINUS, oldNode, newNode);
    }
  }
  return NodeStatus.noChange(node);
}

// If `node` is an addition node with 0 as one of its operands,
// remove 0 from the operands list. Returns a NodeStatus object.
function removeAdditionOfZero(node) {
  if (node.op !== '+') {
    return NodeStatus.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    return NodeType.isConstant(arg) && arg.value === '0';
  });
  const oldNode = node;
  let newNode = clone(node, false);
  if (zeroIndex >= 0) {
    // remove the 0 node
    newNode.args.splice(zeroIndex, 1);
    // if there's only one operand left, there's nothing left to add it to,
    // so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
  return NodeStatus.noChange(node);
}

// If `node` is a multiplication node with 1 as one of its operands,
// remove 1 from the operands list. Returns a NodeStatus object.
function removeMultiplicationByOne(node) {
  if (node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const oneIndex = node.args.findIndex(arg => {
    return NodeType.isConstant(arg) && arg.value === '1';
  });
  const oldNode = node;
  let newNode = clone(node, false);
  if (oneIndex >= 0) {
    // remove the 1 node
    newNode.args.splice(oneIndex, 1);
    // if there's only one operand left, there's nothing left to multiply it
    // to, so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
  return NodeStatus.noChange(node);
}

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a NodeStatus object.
function reduceMultiplicationByZero(node) {
  if (node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    return NodeType.isConstant(arg) && arg.value === '0';
  });
  if (zeroIndex >= 0) {
    // reduce to just the 0 node
    const newNode = NodeCreator.constant(0);
    const oldNode = node;
    return NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a NodeStatus object.
function reduceZeroDivdedByAnything(node) {
  if (node.op !== '/') {
    return NodeStatus.noChange(node);
  }
  if (node.args[0].value === '0') {
    const oldNode = node;
    const newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(
      MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a NodeStatus object.
function reduceExponentByZero(node) {
  if (node.op !== '^') {
    return NodeStatus.noChange(node);
  }
  const exponent = node.args[1];
  if (NodeType.isConstant(exponent) && exponent.value === '0') {
    const simplifiedNode = NodeCreator.constant(1);
    const oldNode = node;
    const nodeString = print(simplifiedNode);
    let changeType = nodeString + '^1 -> ' + nodeString;
    return NodeStatus.nodeChanged(changeType, oldNode, simplifiedNode);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// If `node` is a multiplication node with -1 as one of its operands,
// and a non constant as the next operand, remove -1 from the operands
// list and make the next term have a unary minus.
// Returns a NodeStatus object.
function removeMultiplicationByNegativeOne(node) {
  if (node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const minusOneIndex = node.args.findIndex(arg => {
    return NodeType.isConstant(arg) && arg.value === '-1';
  });
  if (minusOneIndex < 0) {
    return NodeStatus.noChange(node);
  }

  // We might merge/combine the negative one into another node. This stores
  // the index of that other node in the arg list.
  let nodeToCombineIndex;
  // If minus one is the last term, maybe combine with the term before
  if (minusOneIndex + 1 === node.args.length) {
    nodeToCombineIndex = minusOneIndex - 1;
  }
  else {
    nodeToCombineIndex = minusOneIndex + 1;
  }

  let nodeToCombine = node.args[nodeToCombineIndex];
  // If it's a constant, the combining of those terms is handled elsewhere.
  if (NodeType.isConstant(nodeToCombine)) {
    return NodeStatus.noChange(node);
  }

  const oldNode = node;
  let newNode = clone(node, false);

  // Get rid of the -1
  nodeToCombine = Negative.negate(clone(nodeToCombine, false));

  // replace the node next to -1 and remove -1
  newNode.args[nodeToCombineIndex] = nodeToCombine;
  newNode.args.splice(minusOneIndex, 1);

  // if there's only one operand left, move it up the tree
  if (newNode.args.length === 1) {
    newNode = newNode.args[0];
  }
  return NodeStatus.nodeChanged(
    MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
}

// If `node` is a division operation of something by 1 or -1, we can remove the
// denominator. Returns a NodeStatus object.
function removeDivisionByOne(node) {
  if (node.op !== '/') {
    return NodeStatus.noChange(node);
  }
  const denominator = node.args[1];
  if (!NodeType.isConstant(denominator)) {
    return NodeStatus.noChange(node);
  }
  let numerator = clone(node.args[0], false);
  const oldNode = node;

  // if denominator is -1, we make the numerator negative
  if (parseFloat(denominator.value) === -1) {
    // If the numerator was an operation, wrap it in parens before adding -
    // to the front.
    // e.g. 2+3 / -1 ---> -(2+3)
    if (NodeType.isOperator(numerator)) {
      numerator = NodeCreator.parenthesis(numerator);
    }
    numerator = Negative.negate(numerator);
    return NodeStatus.nodeChanged(
      MathChangeTypes.DIVISION_BY_NEG_ONE, oldNode, numerator);
  }
  else if (parseFloat(denominator.value) === 1) {
    return NodeStatus.nodeChanged(
      MathChangeTypes.DIVISION_BY_ONE, oldNode, numerator);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a NodeStatus object.
function removeExponentByOne(node) {
  if (node.op === '^' &&                   // exponent of anything
      NodeType.isConstant(node.args[1]) && // to a constant
      node.args[1].value === '1') {        // of value 1
    const oldNode = node;
    let newNode = clone(node.args[0], false);
    // Note: this is the only change type that gives insight into the exact
    // thing that changed instead of a general rule.
    // TODO: consider doing this for more of them.
    const nodeString = print(newNode);
    let changeType = nodeString + '^1 -> ' + nodeString;
    return NodeStatus.nodeChanged(changeType, oldNode, newNode);
  }
  return NodeStatus.noChange(node);
}

module.exports = simplifyBasicsDFS;
