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

// Evaluate nthRoot() function.
// Returns a NodeStatus object.
function nthRoot(node) {
  if (!NodeType.isFunction(node, 'nthRoot')) {
    return NodeStatus.noChange(node);
  }

  let oldNode = node;
  let newNode = clone(node, false);
  let radicandNode = newNode.args[0];
  const rootNode = newNode.args.length === 2 ? newNode.args[1] : NodeCreator.constant(2);

  if (NodeType.isOperator(radicandNode)) {
    // e.g. exponent and root are equal nthRoot(10^3, 3) = 10
    if (radicandNode.op === '^') {
      const baseNode = radicandNode.args[0];
      const exponentNode = NodeType.isParenthesis(radicandNode.args[1]) ?
        radicandNode.args[1].content : radicandNode.args[1];
      if (rootNode.equals(exponentNode)) {
        newNode = baseNode;
        return NodeStatus.nodeChanged(
          MathChangeTypes.CANCEL_EXPONENT_AND_ROOT, oldNode, newNode);
      }
      else if (NodeType.isConstant(rootNode) && NodeType.isConstant(exponentNode)) {
        const rootValue = parseFloat(rootNode.value);
        const exponentValue = parseFloat(exponentNode.value);
        if (rootValue % exponentValue === 0) {
          const newRootValue = rootValue/exponentValue;
          const newRootNode = NodeCreator.constant(newRootValue);

          newNode = NodeCreator.nthRoot(baseNode, newRootNode);
          return NodeStatus.nodeChanged(
            MathChangeTypes.CANCEL_EXPONENT_AND_ROOT, oldNode, newNode);
        }
        else if (exponentValue % rootValue === 0) {
          const newExponentValue = exponentValue/rootValue;
          const newExponentNode = NodeCreator.constant(newExponentValue);

          newNode = NodeCreator.operator('^', [baseNode, newExponentNode]);
          return NodeStatus.nodeChanged(
            MathChangeTypes.CANCEL_EXPONENT_AND_ROOT, oldNode, newNode);
        }
      }

      return NodeStatus.noChange(node);
    }
    else if (radicandNode.op === '*') {
      const subSteps = [];

      if (NodeType.isConstant(rootNode) && !Negative.isNegative(rootNode)) {
        const rootValue = parseFloat(rootNode.value);

        // 1A. see if we can get prime factors for any of the items in the radicand
        let factoredChildren = [];
        for (let i = 0; i < radicandNode.args.length; i++) {
          const child = radicandNode.args[i];
          if (NodeType.isConstant(child) && !Negative.isNegative(child)) {
            const radicandValue = parseFloat(child.value);
            const factors = Factor.getPrimeFactors(radicandValue);
            const factorNodes = factors.map(NodeCreator.constant);
            factoredChildren = factoredChildren.concat(factorNodes);
          }
          else {
            factoredChildren.push(child);
          }
        }
        if (factoredChildren.length !== radicandNode.args.length) {
          radicandNode = NodeCreator.operator('*', factoredChildren);
          newNode.args[0] = radicandNode;
          subSteps.push(NodeStatus.nodeChanged(
              MathChangeTypes.FACTOR_INTO_PRIMES, oldNode, newNode));

          oldNode = NodeStatus.resetChangeGroups(newNode);
          newNode = clone(oldNode, false);
        }

        // 1B. try to group the children
        factoredChildren.sort((a, b) => {
          if (NodeType.isConstant(a) && NodeType.isConstant(b)) {
            return parseFloat(a.value) - parseFloat(b.value)
          }
          else if (NodeType.isConstant(a)) {
            return -1;
          }
          else if (NodeType.isConstant(b)) {
            return 1;
          }
          return 0;
        });
        let groupedChildren = [], hasGroups = true;
        for (let i = 0; i < factoredChildren.length;) {
          let j = i;
          for (; j < factoredChildren.length; j++) {
            if (!factoredChildren[i].equals(factoredChildren[j]) || (j-i) == rootValue) {
              break;
            }
          }
          if (j - i === rootValue) {
            hasGroups = true;
            const groupedNode = NodeCreator.parenthesis(
              NodeCreator.operator('*', factoredChildren.slice(i, j)));
            groupedChildren.push(groupedNode);
          }
          else {
            groupedChildren = groupedChildren.concat(factoredChildren.slice(i, j));
          }
          i = j;
        }

        // if we don't group any factors, then we can't simplify it any more
        if (hasGroups) {
          radicandNode = groupedChildren.length === 1 ?
              groupedChildren[0] : NodeCreator.operator('*', groupedChildren);
          newNode.args[0] = radicandNode;
          subSteps.push(NodeStatus.nodeChanged(
            MathChangeTypes.GROUP_TERMS_BY_ROOT, oldNode, newNode));


          // 1C. convert grouped factors into exponent nodes
          oldNode = NodeStatus.resetChangeGroups(newNode);
          newNode = clone(oldNode, false);
          for (let i = 0; i < groupedChildren.length; i++) {
            const child = groupedChildren[i];
            if (NodeType.isParenthesis(child)) {
              const grandChild = child.content;
              if (NodeType.isOperator(grandChild) && grandChild.op === '*') {
                const allEqual = grandChild.args.reduce((a, b) => {
                  return a.equals(b);
                });
                if (allEqual) {
                  const baseNode = child.content.args[0];
                  const exponentNode = NodeCreator.constant(rootValue);
                  const newChild = NodeCreator.operator('^', [baseNode, exponentNode]);
                  groupedChildren[i] = newChild;
                }
              }
            }
          }

          if (groupedChildren.length === 1) {
            newNode.args[0] = groupedChildren[0];

            const nodeStatus = nthRoot(newNode);
            newNode = nodeStatus.newNode;
            subSteps.push(nodeStatus);
            return NodeStatus.nodeChanged(
              MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode, true, subSteps);
          }
          else {
            radicandNode = NodeCreator.operator('*', groupedChildren);
            newNode.args[0] = radicandNode;
            subSteps.push(NodeStatus.nodeChanged(
              MathChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, oldNode, newNode));
          }

          oldNode = NodeStatus.resetChangeGroups(newNode);
          newNode = clone(oldNode, false);
        }
      }

      // 2A. distribute radical into children
      let children = [];
      for (let i = 0; i < radicandNode.args.length; i++) {
        const child = radicandNode.args[i];
        children.push(NodeCreator.nthRoot(child, rootNode));
      }

      newNode = NodeCreator.operator('*', children);
      subSteps.push(NodeStatus.nodeChanged(
        MathChangeTypes.DISTRIBUTE_NTH_ROOT, oldNode, newNode));

      oldNode = NodeStatus.resetChangeGroups(newNode);
      newNode = clone(oldNode, false);

      // 2B: compute nth root of each child now
      for (let i = 0; i < newNode.args.length; i++) {
        const child = newNode.args[i];
        const childNodeStatus = nthRoot(child);
        if (childNodeStatus.hasChanged()) {
          newNode.args[i] = childNodeStatus.newNode;
          subSteps.push(NodeStatus.childChanged(newNode, childNodeStatus, i));
        }
      }
      oldNode = NodeStatus.resetChangeGroups(newNode);
      newNode = clone(oldNode, false);

      // 2C: combine back any of the same roots
      const newChildren = [];
      const newRadicandArgs = [];
      for (let i = 0; i < newNode.args.length; i++) {
        const child = newNode.args[i];
        if (NodeType.isFunction(child, 'nthRoot') && child.args[1].equals(rootNode)) {
          newRadicandArgs.push(child.args[0]);
        }
        else {
          newChildren.push(child);
        }
      }

      // if there are no items moved out of the root, then nothing has changed
      if (newChildren.length === 0) {
        return NodeStatus.noChange(node);
      }

      if (newRadicandArgs.length > 0) {
        const newRadicandNode = newRadicandArgs.length === 1 ?
          newRadicandArgs[0] : NodeCreator.operator('*', newRadicandArgs);
        newChildren.push(NodeCreator.nthRoot(newRadicandNode, rootNode));

        newNode = NodeCreator.operator('*', newChildren);
        subSteps.push(NodeStatus.nodeChanged(
          MathChangeTypes.COMBINE_UNDER_ROOT, oldNode, newNode));
      }

      return NodeStatus.nodeChanged(
        MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode, true, subSteps);
    }
    else {
      return NodeStatus.noChange(node);
    }
  }
  else if (NodeType.isConstant(radicandNode)) {
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
        MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode);
    }
    // Try to find if we can simplify by finding factors that can be
    // pulled out of the radical
    else {
      // convert the number into the product of its prime factors
      const factors = Factor.getPrimeFactors(radicandValue);
      if (factors.length > 1) {
        const subSteps = [];
        const factorNodes = factors.map(NodeCreator.constant);

        newNode.args[0] = NodeCreator.operator('*', factorNodes);
        subSteps.push(NodeStatus.nodeChanged(
            MathChangeTypes.FACTOR_INTO_PRIMES, oldNode, newNode));

        // run nthRoot on the new node
        const nodeStatus = nthRoot(newNode);
        if (nodeStatus.hasChanged()) {
          newNode = nodeStatus.newNode;
          subSteps.push(nodeStatus);

          return NodeStatus.nodeChanged(
            MathChangeTypes.NTH_ROOT_VALUE, oldNode, newNode, true, subSteps);
        }
        else {
          return NodeStatus.noChange(node);
        }
      }
      else {
        return NodeStatus.noChange(node);
      }
    }
  }
  else {
    return NodeStatus.noChange(node);
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
