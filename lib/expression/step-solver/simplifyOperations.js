'use strict';

const math = require('../../../index');

const cancelLikeTerms = require('./cancelLikeTerms');
const clone = require('./clone');
const ConstantFraction = require('./ConstantFraction');
const Fraction = require('./Fraction');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const PolynomialTermOperations = require('./PolynomialTermOperations');
const print = require('./print');
const removeUnnecessaryParens = require('./removeUnnecessaryParens');

// If we can do a simplify step (e.g. adding two terms, performing some
// arithmetic). Returns a NodeStatus object.
// This function has 3 parts: simplifications for the node before recursing,
// recursion on the child nodes, and simplifications for the node after
// recursion.
function simplifyOperationsDFS(node) {
  // There are some simplifications that we want to do before recursing,
  // and some after. e.g. 2/2 + 1/2 should be added together instead of
  // recursing on 2/2 and simplifying it together.
  const nodeStatus = simplifyOperationsBeforeRecursion(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }

  // Now recurse on deeper nodes.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = simplifyOperationsDFS(node.content);
    // always update content, since there might be changes that don't count
    // as a step
    node.content = innerNodeStatus.newNode;
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = simplifyOperationsDFS(node.args[0]);
    // always update arg, since there might be changes that don't count
    // as a step
    node.args[0] = innerNodeStatus.newNode;
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = simplifyOperationsDFS(node.args[i]);
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
    return simplifyOperationsAfterRecursion(node);
  }
}

// Both these functions look for a single step to perform on a node (one before
// recursion on its children, one after). If no steps can be taken, returns
// a NO_CHANGE NodeStatus object. Otherwise returns the updated node in a
// NodeStatus object.
function simplifyOperationsBeforeRecursion(node) {
  const simplificationFunctions = [
    // - - becomes +
    simplifyDoubleUnaryMinus,
    // ____^0 --> 1
    reduceExponentByZero,
    // If this is a + node and one of the operands is 0, get rid of the 0
    removeAdditionOfZero,
    // If this is a * node and one of the operands is 1, get rid of the 1
    removeMultiplicationByOne,
    // If this is a / node and the denominator is 1 or -1, get rid of it
    removeDivisionByOne,
    // multiplication by 0 yields 0
    reduceMultiplicationByZero,
    ConstantFraction.addConstantFractions,
  ];

  for (let i = 0; i < simplificationFunctions.length; i++) {
    let nodeStatus = simplificationFunctions[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    // Always update node, since there might be changes that didn't count
    // as a step. Always remove parens that might be unnecessary now.
    node = removeUnnecessaryParens(nodeStatus.newNode);
  }

  return NodeStatus.noChange(node);
}

function simplifyOperationsAfterRecursion(node) {
  const simplificationFunctions = [
    // e.g. (2x * 5) / 2x -> 5
    cancelLikeTerms,
    // Check for x^1 which should be reduced to x
    removeExponentByOne,
    // In some cases, remove multiplying by -1
    removeMultiplicationByNegativeOne,

    // FRACTION simplifications
    ConstantFraction.addConstantAndFraction,
    Fraction.simplifyFraction,
    Fraction.multiplyByInverse,

    // Check if we can perform simple arithmetic on the operands
    // (this has to happen after the fraction stuff or you get infinite loops)
    performArithmetic,
    absoluteValue,

    // POLYNOMIAL TERM simplifications
    PolynomialTermOperations.combinePolynomialTerms,
    // If we have a constant times a polynomial term we can multiply them
    // together e.g. y * 3 -> 3y
    PolynomialTermOperations.multiplyConstantAndPolynomialTerm,
    // Check if we can simplify division in a polynomial term e.g. 2x/4 -> x/2
    PolynomialTermOperations.simplifyPolynomialFraction,
  ];
  for (let i = 0; i < simplificationFunctions.length; i++) {
    let nodeStatus = simplificationFunctions[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    // Always update node, since there might be changes that didn't count
    // as a step. Always remove parens that might be unnecessary now.
    node = removeUnnecessaryParens(nodeStatus.newNode);
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
  const unaryArg = clone(node.args[0]);
  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (NodeType.isUnaryMinus(unaryArg)) {
    const newNode = unaryArg.args[0];
    return NodeStatus.nodeChanged(
      MathChangeTypes.RESOLVE_DOUBLE_UNARY_MINUS, oldNode, newNode);
  }
  // e.g. - -4, -4 could be a constant with negative value
  else if (NodeType.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
    const newNode = NodeCreator.constant(parseFloat(unaryArg.value) * -1);
    return NodeStatus.nodeChanged(
      MathChangeTypes.RESOLVE_DOUBLE_UNARY_MINUS, oldNode, newNode);
  }
  // e.g. -(-(5+2))
  else if (NodeType.isParenthesis(unaryArg)) {
    let parenthesisNode = unaryArg;
    const parenthesisContent = parenthesisNode.content;
    if (NodeType.isUnaryMinus(parenthesisContent)) {
      const newNode = NodeCreator.parenthesis(parenthesisContent.args[0]);
      return NodeStatus.nodeChanged(
        MathChangeTypes.RESOLVE_DOUBLE_UNARY_MINUS, oldNode, newNode);
    }
  }
  return NodeStatus.noChange(node);
}

// Performs arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
// Returns a NodeStatus object.
function performArithmetic(node) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }
  if (!node.args.every(child => NodeType.isConstant(child))) {
    return NodeStatus.noChange(node);
  }

  // Only resolve division of integers if we get an integer result.
  // Note that a fraction of decimals will be divided out.
  if (NodeType.isIntegerFraction(node)) {
    const numeratorValue = parseInt(node.args[0]);
    const denominatorValue = parseInt(node.args[1]);
    if (numeratorValue % denominatorValue === 0) {
      const oldNode = node;
      const newNode = NodeCreator.constant(numeratorValue/denominatorValue);
      return NodeStatus.nodeChanged(
        MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
    }
    else {
      return NodeStatus.noChange(node);
    }
  }
  else {
    const evaluatedValue = manualEval(node);
    const oldNode = node;
    const newNode = NodeCreator.constant(evaluatedValue);
    return NodeStatus.nodeChanged(MathChangeTypes.SIMPLIFY_ARITHMETIC, oldNode, newNode);
  }
}

// Evaluates abs() function if it's on a single constant value.
// Returns a NodeStatus object.
function absoluteValue(node) {
  if (!NodeType.isFunction(node, 'abs')) {
    return NodeStatus.noChange(node);
  }
  if (node.args.length > 1) {
    return NodeStatus.noChange(node);
  }
  const oldNode = node;
  let newNode = clone(node);
  const argument = newNode.args[0];
  if (NodeType.isConstant(argument, true)) {
    newNode = NodeCreator.constant(math.abs(argument.eval()));
    return NodeStatus.nodeChanged(
      MathChangeTypes.ABSOLUTE_VALUE, oldNode, newNode);
  }
  else if (NodeType.isConstantFraction(argument, true)) {
    const newNumerator = NodeCreator.constant(
      math.abs(argument.args[0].eval()));
    const newDenominator =  NodeCreator.constant(
      math.abs(argument.args[1].eval()));
    newNode = NodeCreator.operator('/', [newNumerator, newDenominator]);
    return NodeStatus.nodeChanged(
      MathChangeTypes.ABSOLUTE_VALUE, oldNode, newNode);
  }
  else {
    throw Error('Absolute value should only have constant arguments: ' + argument);
  }
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
  let newNode = clone(node);
  if (zeroIndex >= 0) {
    oldNode.args[zeroIndex].changeGroup = 1;
    // remove the 0 node
    newNode.args.splice(zeroIndex, 1);
    // if there's only one operand left, there's nothing left to add it to,
    // so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      MathChangeTypes.REMOVE_ADDITION_OF_ZERO, oldNode, newNode, false);
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
  let newNode = clone(node);
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
    const nodeString = print(simplifiedNode)
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
  let numerator = clone(node.args[0]);
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
    let newNode = clone(node.args[0]);
    // Note: this is the only change type that gives insight into the exact
    // thing that changed instead of a general rule.
    // TODO: consider doing this for more of them.
    const nodeString = print(newNode)
    let changeType = nodeString + '^1 -> ' + nodeString;
    return NodeStatus.nodeChanged(changeType, oldNode, newNode);
  }
  return NodeStatus.noChange(node);
}

// Evaluates a math expression to a constant, e.g. 3+4 -> 7
// TEMPORARY (hopefully) because apparently operations can only be evaluated
// if they have two arguments?? :(
function manualEval(node) {
  if (NodeType.isParenthesis(node)) {
    node = exp.content;
  }
  let result;
  switch (node.op) {
    case '*':
      result = node.args.map(x => parseFloat(x.value)).reduce(
        (prev, curr) => prev * curr);
      break;
    case '+':
      result = node.args.map(x => parseFloat(x.value)).reduce(
        (prev, curr) => prev + curr);
      break;
    // these operations should only be done with two arguments
    default:
      result = node.eval();
  }
  if (result < 1) {
    result  = parseFloat(result.toPrecision(4));
  }
  else {
    result  = parseFloat(result.toFixed(4));
  }
  return result;
}

module.exports = simplifyOperationsDFS;
