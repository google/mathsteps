'use strict';

/*
 * Performs simpifications that are more basic and overaching like (...)^0 => 1
 * These are always the first simplifications that are attempted.
 */

const clone = require('./util/clone');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./util/Negative');
const NodeCreator = require('./util/NodeCreator');
const NodeStatus = require('./util/NodeStatus');
const NodeType = require('./util/NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');
const PolynomialTermOperations = require('./PolynomialTermOperations');
const TreeSearch = require('./util/TreeSearch');

const SIMPLIFICATION_FUNCTIONS = [
  // multiplication by 0 yields 0
  reduceMultiplicationByZero,
  // division of 0 by something yields 0
  reduceZeroDividedByAnything,
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
  // e.g. x*5 -> 5x
  PolynomialTermOperations.rearrangeCoefficient,
];

const simplifyBasicsSearch = TreeSearch.preOrder(simplifyBasics);

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

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a NodeStatus object.
function reduceExponentByZero(node) {
  if (node.op !== '^') {
    return NodeStatus.noChange(node);
  }
  const exponent = node.args[1];
  if (NodeType.isConstant(exponent) && exponent.value === '0') {
    const newNode = NodeCreator.constant(1);
    return NodeStatus.nodeChanged(
      MathChangeTypes.REDUCE_EXPONENT_BY_ZERO, node, newNode);
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
    let newNode = clone(node.args[0]);
    return NodeStatus.nodeChanged(
      MathChangeTypes.REMOVE_EXPONENT_BY_ONE, node, newNode);
  }
  return NodeStatus.noChange(node);
}

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node) {
  if (!NodeType.isUnaryMinus(node)) {
    return NodeStatus.noChange(node);
  }
  const unaryArg = node.args[0];
  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (NodeType.isUnaryMinus(unaryArg)) {
    const newNode = clone(unaryArg.args[0]);
    return NodeStatus.nodeChanged(
      MathChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. - -4, -4 could be a constant with negative value
  else if (NodeType.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
    const newNode = NodeCreator.constant(parseFloat(unaryArg.value) * -1);
    return NodeStatus.nodeChanged(
      MathChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. -(-(5+2))
  else if (NodeType.isParenthesis(unaryArg)) {
    let parenthesisNode = unaryArg;
    const parenthesisContent = parenthesisNode.content;
    if (NodeType.isUnaryMinus(parenthesisContent)) {
      const newNode = NodeCreator.parenthesis(parenthesisContent.args[0]);
      return NodeStatus.nodeChanged(
        MathChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
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
  let newNode = clone(node);
  if (zeroIndex >= 0) {
    // remove the 0 node
    newNode.args.splice(zeroIndex, 1);
    // if there's only one operand left, there's nothing left to add it to,
    // so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      MathChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
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
  if (oneIndex >= 0) {
    let newNode = clone(node);
    // remove the 1 node
    newNode.args.splice(oneIndex, 1);
    // if there's only one operand left, there's nothing left to multiply it
    // to, so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      MathChangeTypes.REMOVE_MULTIPLYING_BY_ONE, node, newNode);
  }
  return NodeStatus.noChange(node);
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

  let newNode = clone(node);

  // Get rid of the -1
  nodeToCombine = Negative.negate(clone(nodeToCombine));

  // replace the node next to -1 and remove -1
  newNode.args[nodeToCombineIndex] = nodeToCombine;
  newNode.args.splice(minusOneIndex, 1);

  // if there's only one operand left, move it up the tree
  if (newNode.args.length === 1) {
    newNode = newNode.args[0];
  }
  return NodeStatus.nodeChanged(
    MathChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node, newNode);
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
  let numerator = clone(node.args[0]);

  // if denominator is -1, we make the numerator negative
  if (parseFloat(denominator.value) === -1) {
    // If the numerator was an operation, wrap it in parens before adding -
    // to the front.
    // e.g. 2+3 / -1 ---> -(2+3)
    if (NodeType.isOperator(numerator)) {
      numerator = NodeCreator.parenthesis(numerator);
    }
    const changeType = Negative.isNegative(numerator) ?
      MathChangeTypes.RESOLVE_DOUBLE_MINUS :
      MathChangeTypes.DIVISION_BY_NEGATIVE_ONE;
    numerator = Negative.negate(numerator);
    return NodeStatus.nodeChanged(changeType, node, numerator);
  }
  else if (parseFloat(denominator.value) === 1) {
    return NodeStatus.nodeChanged(
      MathChangeTypes.DIVISION_BY_ONE, node, numerator);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

module.exports = simplifyBasicsSearch;
