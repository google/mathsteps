'use strict';

const clone = require('clone');
const math = require('mathjs');

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
  }
  else if (NodeType.isUnaryMinus(node)) {
    innerNodeStatus = evaluateFunctionsDFS(node.args[0]);
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
    // we can't simplify any further
    return NodeStatus.noChange(node);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }

  // If recursing already peformed a step, return with that step.
  // Otherwise try evaluating at this level.
  if (innerNodeStatus.hasChanged()) {
    return NodeStatus.childChanged(node, innerNodeStatus);
  }
  else {
    return evaluateFunctions(node);
  }
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
  let newNode = clone(node, false);
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
    // e.g. exponent and root are equal nthRoot(10^3, 3) = 10
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

// Returns the nthRoot evaluated for an exponent node. Expects an exponent node.
function nthRootExponent(node) {
  let newNode = clone(node, false);

  const radicandNode = node.args[0];
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);
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
// Expects a multiplication node.
function nthRootMultiplication(node) {
  let newNode = clone(node, false);
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);

  let substeps = [];
  let status;
  if (NodeType.isConstant(rootNode) && !Negative.isNegative(rootNode)) {
    status = factorChildren(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
    }

    status = groupTermsByRoot(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
    }

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

  status = distributeNthRoot(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  status = evaluateNthRootForChildren(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

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
// factoring all the arguments under the radicand
function factorChildren(node) {
  let newNode = clone(node, false);
  const radicandNode = node.args[0];

  let children = [];
  for (let i = 0; i < radicandNode.args.length; i++) {
    const child = radicandNode.args[i];

    if (NodeType.isConstant(child) && !Negative.isNegative(child)) {
      const radicandValue = parseFloat(child.value);
      const factors = Factor.getPrimeFactors(radicandValue);
      const factorNodes = factors.map(NodeCreator.constant);
      children = children.concat(factorNodes);
    }
    else {
      children.push(child);
    }
  }

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
  let newNode = clone(node, false);
  const radicandNode = node.args[0];
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);
  const rootValue = parseFloat(rootNode.value);

  radicandNode.args.sort((a, b) => {
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
  });

  let children = [], hasGroups = false;
  for (let i = 0; i < radicandNode.args.length;) {
    let j = i;
    for (; j < radicandNode.args.length; j++) {
      if (!radicandNode.args[i].equals(radicandNode.args[j]) || (j-i) == rootValue) {
        break;
      }
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

  // if we don't group any factors, then we can't simplify it any more
  if (hasGroups) {
    newNode.args[0] = children.length === 1 ?
        children[0] : NodeCreator.operator('*', children);
    return NodeStatus.nodeChanged(
      MathChangeTypes.GROUP_TERMS_BY_ROOT, node, newNode);
  }
  return NodeStatus.noChange(node);
}

// Given an nthRoot node with a constant positive root, will group the arguments
// will convert any grouped factors into exponent nodes as a step
// e.g. nthRoot((2 * 2) * 2, 2) -> nthRoot(2^2 * 2, 2)
function convertMultiplicationToExponent(node) {
  let newNode = clone(node, false);

  const radicandNode = node.args[0];
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);
  const rootValue = parseFloat(rootNode.value);

  if (NodeType.isParenthesis(radicandNode)) {
    const child = radicandNode.content;
    if (NodeType.isOperator(child) && child.op === '*') {
      if (allEqual(child.args)) {
        const baseNode = child.args[0];
        const exponentNode = NodeCreator.constant(rootValue);
        newNode.args[0] = NodeCreator.operator('^', [baseNode, exponentNode]);
        return NodeStatus.nodeChanged(
          MathChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
      }
    }
  }
  else if (NodeType.isOperator(radicandNode) && radicandNode.op === '*') {
    const children = [];
    for (let i = 0; i < radicandNode.args.length; i++) {
      const child = radicandNode.args[i];
      if (NodeType.isParenthesis(child)) {
        const grandChild = child.content;
        if (grandChild.op === '*' && allEqual(grandChild.args)) {
          const baseNode = child.content.args[0];
          const exponentNode = NodeCreator.constant(rootValue);
          children.push(NodeCreator.operator('^', [baseNode, exponentNode]));
          continue;
        }
      }
      children.push(child);
    }

    newNode.args[0] = NodeCreator.operator('*', children);
    return NodeStatus.nodeChanged(
      MathChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
  }

  return NodeStatus.noChange(node);
}

// Given an nthRoot node with a multiplication under the radicand, will
// distribute the nthRoot to all the arguments under the radicand as a dtep
// e.g. nthRoot(2 * x^2, 2) -> nthRoot(2) * nthRoot(x^2)
function distributeNthRoot(node) {
  let newNode = clone(node, false);
  const radicandNode = node.args[0];
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);

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
// will evaluate the nthRoot of each Node as a substep
// e.g. nthRoot(2) * nthRoot(x^2) -> nthRoot(2) * x
function evaluateNthRootForChildren(node) {
  let newNode = clone(node, false);

  const substeps = [];
  for (let i = 0; i < newNode.args.length; i++) {
    const child = newNode.args[i];
    const childNodeStatus = nthRoot(child);
    if (childNodeStatus.hasChanged()) {
      newNode.args[i] = childNodeStatus.newNode;
      substeps.push(NodeStatus.childChanged(newNode, childNodeStatus, i));
    }
  }

  if (substeps.length > 0) {
    return NodeStatus.nodeChanged(
      MathChangeTypes.EVALUATE_DISTRIBUTED_NTH_ROOT, node, newNode, true, substeps);
  }

  return NodeStatus.noChange(node);
}

// Given a multiplication nodes, including nthRoots, will combine the nodes
// with the same radicand as a step
// e.g. 2 * nthRoot(2) * nthRoot(x) -> 2 * nthRoot(2 * x)
function combineRoots(node) {
  let newNode = clone(node, false);
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);

  const children = [];
  const radicandArgs = [];
  for (let i = 0; i < newNode.args.length; i++) {
    const child = newNode.args[i];
    if (NodeType.isFunction(child, 'nthRoot') && child.args[1].equals(rootNode)) {
      radicandArgs.push(child.args[0]);
    }
    else {
      children.push(child);
    }
  }

  // if there are no items moved out of the root, then nothing has changed
  if (children.length > 0) {
    if (radicandArgs.length > 0) {
      const radicandNode = radicandArgs.length === 1 ?
        radicandArgs[0] : NodeCreator.operator('*', radicandArgs);
      children.push(NodeCreator.nthRoot(radicandNode, rootNode));
    }

    newNode = NodeCreator.operator('*', children);
    return NodeStatus.nodeChanged(
      MathChangeTypes.COMBINE_UNDER_ROOT, node, newNode);
  }

  return NodeStatus.noChange(node);
}

// Returns the nthRoot evaluated on a constant node
// Potentially factors the constant node into primes, and calls
// nthRootMultiplication on the new nthRoot
function nthRootConstant(node) {
  let newNode = clone(node, false);
  const radicandNode = node.args[0];
  const rootNode = node.args.length === 2 ? node.args[1] : NodeCreator.constant(2);

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
      const substeps = [];
      const factorNodes = factors.map(NodeCreator.constant);

      newNode.args[0] = NodeCreator.operator('*', factorNodes);
      substeps.push(NodeStatus.nodeChanged(
          MathChangeTypes.FACTOR_INTO_PRIMES, node, newNode));

      // run nthRoot on the new node
      const nodeStatus = nthRootMultiplication(newNode);
      if (nodeStatus.hasChanged()) {
        substeps.push(nodeStatus);
        newNode = nodeStatus.newNode;

        return NodeStatus.nodeChanged(
          MathChangeTypes.NTH_ROOT_VALUE, node, newNode, true, substeps);
      }
    }
  }

  return NodeStatus.noChange(node);
}

// Simple helper function which determines if all the given nodes are equal
function allEqual(nodes) {
  return nodes.reduce((a, b) => {
    return a.equals(b);
  });
}

module.exports = evaluateFunctionsDFS;
