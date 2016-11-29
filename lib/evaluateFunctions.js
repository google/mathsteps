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

// Evaluate nthRoot() function
// Returns a NodeStatus object.
function nthRoot(node) {
  if (!NodeType.isFunction(node, 'nthRoot')) {
    return NodeStatus.noChange(node);
  }

  let oldNode = node;
  let newNode = clone(node, false);
  const radicandNode = newNode.args[0];
  const rootNode = newNode.args.length === 2 ? newNode.args[1] : NodeCreator.constant(2);

  if (NodeType.isOperator(radicandNode)) {
    // if is operator and operation is addition, we can't do anything
    if (radicandNode.op === '+' || radicandNode.op === '-') {
      return NodeStatus.noChange(node);
    }
    else if (radicandNode.op === '*' || radicandNode.op === '/') {
      // distribute the root into the children
      const subSteps = [];
      const children = [];
      for (let i = 0; i < radicandNode.args.length; i++) {
        const child = radicandNode.args[i];
        children.push(NodeCreator.nthRoot(child, rootNode));
      }
      newNode = NodeCreator.operator(radicandNode.op, children);
      subSteps.push(NodeStatus.nodeChanged(
        MathChangeTypes.DISTRIBUTE_NTH_ROOT, oldNode, newNode));

      oldNode = NodeStatus.resetChangeGroups(newNode);
      newNode = clone(oldNode, false);

      for (let i = 0; i < newNode.args.length; i++) {
        const child = radicandNode.args[i];
        const childNodeStatus = nthRoot(child);
        if (childNodeStatus.hasChanged()) {
          newNode.args[i] = childNodeStatus.newNode;
          subSteps.push(NodeStatus.childChanged(newNode, childNodeStatus, i));
        }
      }

      return NodeStatus.nodeChanged(
        MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode, true, subSteps);
    }
    else if (radicandNode.op === '^') {
      const baseNode = radicandNode.args[0];
      const exponentNode = radicandNode.args[1];
      // TODO(ael): this only works if they actually have a value...
      // ideally I'd use equals, but the nodes are different for some reason
      // even if the value is the same...
      if (rootNode.value === exponentNode.value) {
        newNode = baseNode;
        return NodeStatus.nodeChanged(
          MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode);
      } else {
        return NodeStatus.noChange(node);
      }
    }
    else {
      throw Error('Operation not supported: ' + radicandNode.op);
    }
  }
  else if (NodeType.isConstant(radicandNode)) {
    // if it's negative, don't do anything (until imaginary number support)
    if (Negative.isNegative(radicandNode)) {
      return NodeStatus.noChange(node);
    }
    else if (!NodeType.isConstant(rootNode) || Negative.isNegative(rootNode)) {
      return NodeStatus.noChange(node);
    }

    const radicandValue = parseFloat(radicandNode.value);
    const rootValue = parseFloat(rootNode.value);
    const nthRootValue = math.nthRoot(radicandValue, rootValue);
    if (nthRootValue % 1 === 0) {
      newNode = NodeCreator.constant(nthRootValue);
      return NodeStatus.nodeChanged(
        MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode);
    }
    else {
      const subSteps = [];

      // 1. convert the number into the product of its prime factors
      const factors = Factor.getPrimeFactors(radicandValue);
      const factorNodes = factors.map(factor => {
        return NodeCreator.constant(factor);
      })

      newNode.args[0] = NodeCreator.operator('*', factorNodes);
      subSteps.push(NodeStatus.nodeChanged(
          MathChangeTypes.FACTOR_INTO_PRIMES, oldNode, newNode));

      // TODO: Consider moving steps 2, 3 and 4 into distributing the
      // radical into children above, and just calling nthNode on the
      // factored version

      // 2. group any prime factors that show up root times
      oldNode = NodeStatus.resetChangeGroups(newNode);
      newNode = clone(oldNode, false);

      let groupedFactors = [];
      let hasGroups = false;
      let i = 0;
      while (i < factors.length) {
        let j = i;
        while (j < factors.length) {
          if (factors[i] !== factors[j]) {
            break;
          }
          j++;
        }
        if (j - i >= rootValue) {
          let groupEnd = i + rootValue;
          groupedFactors.push(factors.slice(i, groupEnd));
          hasGroups = true;
          i = groupEnd;
        }
        else {
          groupedFactors = groupedFactors.concat(factors.slice(i, j));
          i = j;
        }
      }

      if (!hasGroups) {
        return NodeStatus.noChange(node);
      }

      let children = [];
      for (let i = 0; i < groupedFactors.length; i++) {
        const item = groupedFactors[i];
        if (groupedFactors[i].constructor === Array) {
          const groupedChildren = [];
          for (let j = 0; j < groupedFactors[i].length; j++) {
            groupedChildren.push(
              NodeCreator.constant(groupedFactors[i][j]));
          }
          children.push(NodeCreator.parenthesis(
            NodeCreator.operator('*', groupedChildren)));
        }
        else {
          children.push(NodeCreator.constant(groupedFactors[i]));
        }
      }

      newNode.args[0] = NodeCreator.operator('*', children);
      subSteps.push(NodeStatus.nodeChanged(
          MathChangeTypes.GROUP_PRIME_FACTORS, oldNode, newNode));

      // 3. convert grouped factors into exponent nodes
      oldNode = NodeStatus.resetChangeGroups(newNode);
      newNode = clone(oldNode, false);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (NodeType.isParenthesis(child)) {
          const childNodeStatus = convertMultiplicationToExponent(child.content);
          newNode.args[0].args[i] = childNodeStatus.newNode;
          subSteps.push(NodeStatus.childChanged(newNode, childNodeStatus, i));
        }
      }

      // 4. move grouped factors outside of the radical
      oldNode = NodeStatus.resetChangeGroups(newNode);
      newNode = clone(oldNode, false);

      const newArgs = [];
      const newRadicandArgs = [];
      for (let i = 0; i < newNode.args[0].args.length; i++) {
        const child =  newNode.args[0].args[i];
        if (NodeType.isOperator(child) && child.op === '^') {
          if (child.args[1].value === rootNode.value) {
            newArgs.push(child.args[0]);
            continue;
          }
        }
        newRadicandArgs.push(child);
      }

      if (newRadicandArgs.length > 0) {
        let newRadicandNode;
        if (newRadicandArgs.length == 1) {
          newRadicandNode = newRadicandArgs[0];
        }
        else {
          newRadicandNode = NodeCreator.operator('*', newRadicandArgs)
        }
        newArgs.push(NodeCreator.nthRoot(newRadicandNode, rootNode));
      }

      newNode = NodeCreator.operator('*', newArgs);
      subSteps.push(NodeStatus.nodeChanged(
        MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode));

      return NodeStatus.nodeChanged(
        MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode, true, subSteps);
    }
  }
  else {
    return NodeStatus.noChange(node);
  }
}

function convertMultiplicationToExponent(node) {
  if (!NodeType.isOperator(node) && node.op !== '*') {
    return NodeStatus.noChange(node);
  }

  // check if they are all the nodes are equal
  const equal = node.args.reduce((a, b) => {
    return a.equals(b);
  });
  if (!equal) {
    return NodeStatus.noChange(node);
  }

  const baseNode = node.args[0];
  const exponentNode = NodeCreator.constant(node.args.length);
  const newNode = NodeCreator.operator('^', [baseNode, exponentNode])

  return NodeStatus.nodeChanged(
    MathChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
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

module.exports = evaluateFunctionsDFS;
