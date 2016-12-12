'use strict';

const math = require('mathjs');

const clone = require('./clone');
const Factor = require('./Factor');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

const FUNCTIONS = [
  nthRoot,
  absoluteValue
];

// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a NodeStatus object.
function evaluateFunctionsDFS(node) {
  // First recurse on deeper nodes in the tree.
  let innerNodeStatus;
  if (NodeType.isParenthesis(node)) {
    innerNodeStatus = evaluateFunctionsDFS(node.content);
    if (innerNodeStatus.hasChanged()) {
      return NodeStatus.childChanged(node, innerNodeStatus);
    }
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = evaluateFunctionsDFS(node.args[0]);
    if (innerNodeStatus.hasChanged()) {
      return NodeStatus.childChanged(node, innerNodeStatus);
    }
  }
  else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      innerNodeStatus = evaluateFunctionsDFS(node.args[i]);
      if (innerNodeStatus.hasChanged()) {
        return NodeStatus.childChanged(node, innerNodeStatus, i);
      }
    }
  }
  else if (NodeType.isSymbol(node) || NodeType.isConstant(node)) {
    return NodeStatus.noChange(node);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }

  // If no children changed, try evaluating at this level.
  return evaluateFunctions(node);
}

// Evaluates a function call if possible. Returns a NodeStatus object.
function evaluateFunctions(node) {
  if (!NodeType.isFunction(node)) {
    return NodeStatus.noChange(node);
  }

  for (let i = 0; i < FUNCTIONS.length; i++) {
    let nodeStatus = FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
  }
  return NodeStatus.noChange(node);
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
    return NodeStatus.noChange(node);
  }
}

// Evaluate nthRoot() function.
// Returns a NodeStatus object.
function nthRoot(node) {
  if (!NodeType.isFunction(node, 'nthRoot')) {
    return NodeStatus.noChange(node);
  }

  const radicandNode = node.args[0];
  if (NodeType.isOperator(radicandNode)) {
    if (radicandNode.op === '^') {
      return nthRootExponent(node);
    }
    else if (radicandNode.op === '*') {
      return nthRootMultiplication(node);
    }
  }
  else if (NodeType.isConstant(radicandNode)) {
    return nthRootConstant(node);
  }

  return NodeStatus.noChange(node);
}

// Returns the nthRoot evaluated for an exponent node. Expects an exponent under
// the radicand. Cancels the root and the exponent if possible. Three cases:
// equal: nthRoot(2^x, x) = 2
// root > exponent: nthRoot(x^2, 4) = nthRoot(x, 2)
// exponent > root: nthRoot(x^4, 2) = x^2
function nthRootExponent(node) {
  let newNode = clone(node);

  const radicandNode = node.args[0];
  const rootNode = getRootNode(node);
  const baseNode = radicandNode.args[0];
  const exponentNode = NodeType.isParenthesis(radicandNode.args[1]) ?
    radicandNode.args[1].content : radicandNode.args[1];
  if (rootNode.equals(exponentNode)) {
    newNode = baseNode;
    return NodeStatus.nodeChanged(
      MathChangeTypes.CANCEL_EXPONENT_AND_ROOT, node, newNode);
  }
  else if (NodeType.isConstant(rootNode) && NodeType.isConstant(exponentNode)) {
    const rootValue = parseFloat(rootNode.value);
    const exponentValue = parseFloat(exponentNode.value);
    if (rootValue % exponentValue === 0) {
      const newRootValue = rootValue/exponentValue;
      const newRootNode = NodeCreator.constant(newRootValue);

      newNode = NodeCreator.nthRoot(baseNode, newRootNode);
      return NodeStatus.nodeChanged(
        MathChangeTypes.CANCEL_EXPONENT, node, newNode);
    }
    else if (exponentValue % rootValue === 0) {
      const newExponentValue = exponentValue/rootValue;
      const newExponentNode = NodeCreator.constant(newExponentValue);

      newNode = NodeCreator.operator('^', [baseNode, newExponentNode]);
      return NodeStatus.nodeChanged(
        MathChangeTypes.CANCEL_ROOT, node, newNode);
    }
  }

  return NodeStatus.noChange(node);
}

// Returns the nthRoot evaluated for a multiplication node.
// Expects a multiplication node uder the radicand.
// If the root is a positive constant, it:
//  1A: factors the multiplicands
//  1B: groups them into groups whose length is the root value
//  1C: converts the multiplications into exponents.
// If it's possible to simplify further, it:
//  2A: Distributes the nthRoot into the children nodes,
//  2B: evaluates those nthRoots
//  2C: combines them
function nthRootMultiplication(node) {
  let newNode = clone(node);
  const rootNode = getRootNode(node);

  let substeps = [];
  let status;
  if (NodeType.isConstant(rootNode) && !Negative.isNegative(rootNode)) {
    // Step 1A
    status = factorMultiplicands(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
    }

    // Step 1B
    status = groupTermsByRoot(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
    }

    // Step 1C
    status = convertMultiplicationToExponent(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
      if (newNode.args[0].op === '^') {
        status = nthRootExponent(newNode);
        substeps.push(status);
        return NodeStatus.nodeChanged(
          MathChangeTypes.NTH_ROOT_VALUE, node, status.newNode, true, substeps);
      }
    }
  }

  // Step 2A
  status = distributeNthRoot(newNode);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // Step 2B
  status = evaluateNthRootForChildren(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // Step 2C
    status = combineRoots(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
    }

    return NodeStatus.nodeChanged(
      MathChangeTypes.NTH_ROOT_VALUE, node, newNode, true, substeps);
  }

  return NodeStatus.noChange(node);
}

// Given an nthRoot node with a constant positive root, will do the step of
// factoring all the multiplicands under the radicand
// e.g. nthRoot(2 * 9 * 5 * 12) = nthRoot(2 * 3 * 3 * 5 * 2 * 2 * 3)
function factorMultiplicands(node) {
  let newNode = clone(node);
  const radicandNode = node.args[0];

  let children = [];
  radicandNode.args.forEach(child => {
    if (NodeType.isConstant(child) && !Negative.isNegative(child)) {
      const radicandValue = parseFloat(child.value);
      const factors = Factor.getPrimeFactors(radicandValue);
      const factorNodes = factors.map(NodeCreator.constant);
      children = children.concat(factorNodes);
    }
    else {
      children.push(child);
    }
  });

  if (children.length !== radicandNode.args.length) {
    newNode.args[0] = NodeCreator.operator('*', children);
    return NodeStatus.nodeChanged(
      MathChangeTypes.FACTOR_INTO_PRIMES, node, newNode);
  }

  return NodeStatus.noChange(node);
}

// Given an nthRoot node with a constant positive root, will group the arguments
// into groups of the root as a step
// e.g. nthRoot(2 * 2 * 2, 2) -> nthRoot((2 * 2) * 2, 2)
function groupTermsByRoot(node) {
  let newNode = clone(node);
  const radicandNode = node.args[0];
  const rootNode = getRootNode(node);
  const rootValue = parseFloat(rootNode.value);

  radicandNode.args.sort(sortNodes);

  // We want to go through the sorted nodes, and try to find any groups of the
  // same node that are the size of the root value
  let children = [], hasGroups = false;
  for (let i = 0; i < radicandNode.args.length;) {
    let j = i;
    const initialNode = radicandNode.args[i];
    while (j < radicandNode.args.length && j - i < rootValue) {
      const siblingNode = radicandNode.args[j];
      if (!initialNode.equals(siblingNode)) {
        break;
      }
      j++;
    }
    if (j - i === rootValue) {
      hasGroups = true;
      const groupedNode = NodeCreator.parenthesis(
        NodeCreator.operator('*', radicandNode.args.slice(i, j)));
      children.push(groupedNode);
    }
    else {
      children = children.concat(radicandNode.args.slice(i, j));
    }
    i = j;
  }

  if (hasGroups) {
    newNode.args[0] = children.length === 1 ?
        children[0] : NodeCreator.operator('*', children);
    return NodeStatus.nodeChanged(
      MathChangeTypes.GROUP_TERMS_BY_ROOT, node, newNode);
  }
  // if we don't group any factors, then we can't simplify it any more
  return NodeStatus.noChange(node);
}

// Given an nthRoot node with a constant positive root,
// will convert any grouped factors into exponent nodes as a step
// e.g. nthRoot((2 * 2) * 2, 2) -> nthRoot(2^2 * 2, 2)
function convertMultiplicationToExponent(node) {
  let newNode = clone(node);

  const radicandNode = node.args[0];

  if (NodeType.isParenthesis(radicandNode)) {
    const child = radicandNode.content;
    if (isMultiplicationOfEqualNodes(child)) {
      const baseNode = child.args[0];
      const exponentNode = NodeCreator.constant(child.args.length);
      newNode.args[0] = NodeCreator.operator('^', [baseNode, exponentNode]);
      return NodeStatus.nodeChanged(
        MathChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
    }
  }
  else if (NodeType.isOperator(radicandNode) && radicandNode.op === '*') {
    const children = [];
    radicandNode.args.forEach(child => {
      if (NodeType.isParenthesis(child)) {
        const grandChild = child.content;
        if (isMultiplicationOfEqualNodes(grandChild)) {
          const baseNode = grandChild.args[0];
          const exponentNode = NodeCreator.constant(grandChild.args.length);
          children.push(NodeCreator.operator('^', [baseNode, exponentNode]));
          return;
        }
      }
      children.push(child);
    });

    newNode.args[0] = NodeCreator.operator('*', children);
    return NodeStatus.nodeChanged(
      MathChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
  }

  return NodeStatus.noChange(node);
}

// Given an nthRoot node with a multiplication under the radicand, will
// distribute the nthRoot to all the arguments under the radicand as a step
// e.g. nthRoot(2 * x^2, 2) -> nthRoot(2) * nthRoot(x^2)
function distributeNthRoot(node) {
  let newNode = clone(node);
  const radicandNode = node.args[0];
  const rootNode = getRootNode(node);

  const children = [];
  for (let i = 0; i < radicandNode.args.length; i++) {
    const child = radicandNode.args[i];
    children.push(NodeCreator.nthRoot(child, rootNode));
  }

  newNode = NodeCreator.operator('*', children);
  return NodeStatus.nodeChanged(
    MathChangeTypes.DISTRIBUTE_NTH_ROOT, node, newNode);
}

// Given a multiplication node of nthRoots (with the same root)
// will evaluate the nthRoot of each child as a substep
// e.g. nthRoot(2) * nthRoot(x^2) -> nthRoot(2) * x
function evaluateNthRootForChildren(node) {
  let newNode = clone(node);

  const substeps = [];
  for (let i = 0; i < newNode.args.length; i++) {
    const child = newNode.args[i];
    const childNodeStatus = nthRoot(child);
    if (childNodeStatus.hasChanged()) {
      newNode.args[i] = childNodeStatus.newNode;
      substeps.push(NodeStatus.childChanged(newNode, childNodeStatus, i));
    }
  }

  if (substeps.length === 0) {
    return NodeStatus.noChange(node);
  }
  else if (substeps.length === 1) {
    return substeps[0];
  }
  else {
    return NodeStatus.nodeChanged(
      MathChangeTypes.EVALUATE_DISTRIBUTED_NTH_ROOT, node, newNode, true, substeps);
  }
}

// Given a multiplication node, with children including nthRoots, will combine
// the nodes with the same radicand as a step
// e.g. 2 * nthRoot(2) * nthRoot(x) -> 2 * nthRoot(2 * x)
// Assumes that all the roots are the same (that this is occuring right
// after distributeNthRoot and evaluateNthRootForChildren)
function combineRoots(node) {
  let newNode = clone(node);

  let rootNode;
  const children = [];
  const radicandArgs = [];
  for (let i = 0; i < newNode.args.length; i++) {
    const child = newNode.args[i];
    if (NodeType.isFunction(child, 'nthRoot')) {
      radicandArgs.push(child.args[0]);
      rootNode = getRootNode(child);
    }
    else {
      children.push(child);
    }
  }

  if (children.length > 0) {
    if (radicandArgs.length > 0) {
      const radicandNode = radicandArgs.length === 1 ?
        radicandArgs[0] : NodeCreator.operator('*', radicandArgs);
      children.push(NodeCreator.nthRoot(radicandNode, rootNode));
    }

    newNode = NodeCreator.operator('*', children);
    if (!newNode.equals(node)) {
      return NodeStatus.nodeChanged(
        MathChangeTypes.COMBINE_UNDER_ROOT, node, newNode);
    }
  }

  // if there are no items moved out of the root, then nothing has changed
  return NodeStatus.noChange(node);
}

// Returns the nthRoot evaluated on a constant node
// Potentially factors the constant node into primes, and calls
// nthRootMultiplication on the new nthRoot
function nthRootConstant(node) {
  let newNode = clone(node);
  const radicandNode = node.args[0];
  const rootNode = getRootNode(node);

  if (Negative.isNegative(radicandNode)) {
    return NodeStatus.noChange(node);
  }
  else if (!NodeType.isConstant(rootNode) || Negative.isNegative(rootNode)) {
    return NodeStatus.noChange(node);
  }

  const radicandValue = parseFloat(radicandNode.value);
  const rootValue = parseFloat(rootNode.value);
  const nthRootValue = math.nthRoot(radicandValue, rootValue);
  // Perfect root e.g. nthRoot(4, 2) = 2
  if (nthRootValue % 1 === 0) {
    newNode = NodeCreator.constant(nthRootValue);
    return NodeStatus.nodeChanged(
      MathChangeTypes.NTH_ROOT_VALUE, node, newNode);
  }
  // Try to find if we can simplify by finding factors that can be
  // pulled out of the radical
  else {
    // convert the number into the product of its prime factors
    const factors = Factor.getPrimeFactors(radicandValue);
    if (factors.length > 1) {
      let substeps = [];
      const factorNodes = factors.map(NodeCreator.constant);

      newNode.args[0] = NodeCreator.operator('*', factorNodes);
      substeps.push(NodeStatus.nodeChanged(
          MathChangeTypes.FACTOR_INTO_PRIMES, node, newNode));

      // run nthRoot on the new node
      const nodeStatus = nthRootMultiplication(newNode);
      if (nodeStatus.hasChanged()) {
        substeps = substeps.concat(nodeStatus.substeps);
        newNode = nodeStatus.newNode;

        return NodeStatus.nodeChanged(
          MathChangeTypes.NTH_ROOT_VALUE, node, newNode, true, substeps);
      }
    }
  }

  return NodeStatus.noChange(node);
}

// Helpers

// Given an nthRoot node, will return the root node.
// The root node is the second child of the nthRoot node, but if one doesn't
// exist, we assume it's a square root and return 2.
function getRootNode(node) {
  if (!NodeType.isFunction(node, 'nthRoot')) {
    throw Error('Expected nthRoot');
  }

  return node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);
}

// Sorts nodes, ordering constants nodes from smallest to largest and symbol
// nodes after
function sortNodes(a, b) {
  if (NodeType.isConstant(a) && NodeType.isConstant(b)) {
    return parseFloat(a.value) - parseFloat(b.value);
  }
  else if (NodeType.isConstant(a)) {
    return -1;
  }
  else if (NodeType.isConstant(b)) {
    return 1;
  }
  return 0;
}

// Simple helper function which determines a node is a multiplication node
// of all equal nodes
function isMultiplicationOfEqualNodes(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return false;
  }

  // return if they are all equal nodes
  return node.args.reduce((a, b) => {
    return a.equals(b);
  });

}

module.exports = evaluateFunctionsDFS;
