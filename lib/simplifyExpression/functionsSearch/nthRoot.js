const clone = require('../../util/clone');
const math = require('mathjs');

const ChangeTypes = require('../../ChangeTypes');
const ConstantFactors = require('../../factor/ConstantFactors');
const Negative = require('../../Negative');
const Node = require('../../node');
const print = require('../../util/print');

// Evaluate nthRoot() function.
// Returns a Node.Status object.
function nthRoot(node) {
  if (!Node.Type.isFunction(node, 'nthRoot')) {
    return Node.Status.noChange(node);
  }

  const radicandNode = getRadicandNode(node);

  if (Node.Type.isOperator(radicandNode)) {
    if (radicandNode.op === '^') {
      return nthRootExponent(node);
    }
    else if (radicandNode.op === '*') {
      return nthRootMultiplication(node);
    }
  }
  else if (Node.Type.isConstant(radicandNode)) {
    return nthRootConstant(node);
  }

  return Node.Status.noChange(node);
}

// Returns the nthRoot evaluated for an exponent node. Expects an exponent under
// the radicand. Cancels the root and the exponent if possible. Three cases:
// equal: nthRoot(2^x, x) = 2
// root > exponent: nthRoot(x^2, 4) = nthRoot(x, 2)
// exponent > root: nthRoot(x^4, 2) = x^2
function nthRootExponent(node) {
  let newNode = clone(node);

  const radicandNode = getRadicandNode(node);
  const rootNode = getRootNode(node);
  const baseNode = radicandNode.args[0];
  const exponentNode = Node.Type.isParenthesis(radicandNode.args[1])
        ? radicandNode.args[1].content
        : radicandNode.args[1];
  if (rootNode.equals(exponentNode)) {
    newNode = baseNode;
    return Node.Status.nodeChanged(
      ChangeTypes.CANCEL_EXPONENT_AND_ROOT, node, newNode);
  }
  else if (Node.Type.isConstant(rootNode) && Node.Type.isConstant(exponentNode)) {
    const rootValue = parseFloat(rootNode.value);
    const exponentValue = parseFloat(exponentNode.value);
    if (rootValue % exponentValue === 0) {
      const newRootValue = rootValue/exponentValue;
      const newRootNode = Node.Creator.constant(newRootValue);

      newNode = Node.Creator.nthRoot(baseNode, newRootNode);
      return Node.Status.nodeChanged(
        ChangeTypes.CANCEL_EXPONENT, node, newNode);
    }
    else if (exponentValue % rootValue === 0) {
      const newExponentValue = exponentValue/rootValue;
      const newExponentNode = Node.Creator.constant(newExponentValue);

      newNode = Node.Creator.operator('^', [baseNode, newExponentNode]);
      return Node.Status.nodeChanged(
        ChangeTypes.CANCEL_ROOT, node, newNode);
    }
  }

  return Node.Status.noChange(node);
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

  const substeps = [];
  let status;
  if (Node.Type.isConstant(rootNode) && !Negative.isNegative(rootNode)) {
    // Step 1A
    status = factorMultiplicands(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = Node.Status.resetChangeGroups(status.newNode);
    }

    // Step 1B
    status = groupTermsByRoot(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = Node.Status.resetChangeGroups(status.newNode);
    }

    // Step 1C
    status = convertMultiplicationToExponent(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = Node.Status.resetChangeGroups(status.newNode);
      if (newNode.args[0].op === '^') {
        status = nthRootExponent(newNode);
        substeps.push(status);
        return Node.Status.nodeChanged(
          ChangeTypes.NTH_ROOT_VALUE, node, status.newNode, true, substeps);
      }
    }
  }

  // Step 2A
  status = distributeNthRoot(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  // Step 2B
  status = evaluateNthRootForChildren(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);

    // Step 2C
    status = combineRoots(newNode);
    if (status.hasChanged()) {
      substeps.push(status);
      newNode = Node.Status.resetChangeGroups(status.newNode);
    }

    return Node.Status.nodeChanged(
      ChangeTypes.NTH_ROOT_VALUE, node, newNode, true, substeps);
  }

  return Node.Status.noChange(node);
}

// Given an nthRoot node with a constant positive root, will do the step of
// factoring all the multiplicands under the radicand
// e.g. nthRoot(2 * 9 * 5 * 12) = nthRoot(2 * 3 * 3 * 5 * 2 * 2 * 3)
function factorMultiplicands(node) {
  const newNode = clone(node);
  const radicandNode = getRadicandNode(node);
  let children = [];
  let factored = false;
  radicandNode.args.forEach(child => {
    if (Node.PolynomialTerm.isPolynomialTerm(child)) {
      const polyTerm = new Node.PolynomialTerm(child);
      const coeffNode = polyTerm.getCoeffNode();
      const polyTermNoCoeff = Node.Creator.polynomialTerm(
        polyTerm.getSymbolNode(), polyTerm.getExponentNode(), null);
      if (coeffNode) {
        const factorNodes = getFactorNodes(coeffNode);
        if (factorNodes.length > 1) {
          factored = true;
        }
        children = children.concat(factorNodes);
      }
      children.push(polyTermNoCoeff);
    }
    else {
      const factorNodes = getFactorNodes(child);
      if (factorNodes.length > 1) {
        factored = true;
      }
      children = children.concat(factorNodes);
    }
  });

  if (factored) {
    newNode.args[0] = Node.Creator.operator('*', children);
    return Node.Status.nodeChanged(
      ChangeTypes.FACTOR_INTO_PRIMES, node, newNode);
  }

  return Node.Status.noChange(node);
}

function getFactorNodes(node) {
  if (Node.Type.isConstant(node) && !Negative.isNegative(node)) {
    const value = parseFloat(node.value);
    const factors = ConstantFactors.getPrimeFactors(value);
    const factorNodes = factors.map(Node.Creator.constant);
    return factorNodes;
  }
  return [node];
}

// Given an nthRoot node with a constant positive root, will group the arguments
// into groups of the root as a step
// e.g. nthRoot(2 * 2 * 2, 2) -> nthRoot((2 * 2) * 2, 2)
function groupTermsByRoot(node) {
  let newNode = clone(node);
  const radicandNode = getRadicandNode(node);
  const rootNode = getRootNode(node);
  const rootValue = parseFloat(rootNode.value);

  radicandNode.args.sort(sortNodes);

  const termStrings = radicandNode.args.map(arg => print.ascii(arg));


  // there is nothing to simplify when there are no duplicates of factors in the radicand
  if ([...new Set(termStrings)].length === termStrings.length) {
    return Node.Status.noChange(node);
  }

  // dictionary storing the number of times a constant appears
  // e.g. 2 * 2 * 2 => {'2': 3} , 2 appears 3 times
  const count = {};

  radicandNode.args.forEach(arg => {
    const argString = print.ascii(arg);
    count[argString] ? count[argString]++ : count[argString] = 1;
  });

  const termString = Object.keys(count);

  const newTermGroups = termString.map(key => {
    let leftover = count[key];
    const term = math.parse(key);
    const times = rootValue;

    const args = [];

    // Recursively create groups
    while (leftover - times > 0) {
      leftover -= times;
      args.push(Node.Creator.parenthesis(
        Node.Creator.operator('*', Array(times).fill(term))));
    }

    // Remaining terms after groups have been created
    const remainder = leftover === 1
      ? term
      : Node.Creator.parenthesis(
        Node.Creator.operator('*', Array(leftover).fill(term)));
    args.push(remainder);

    return args;
  });

  // Compress array of arrays
  const newTerms = newTermGroups.reduce((acc, val) => acc.concat(val), []);

  const newBase = Node.Creator.operator('*', newTerms);

  newNode = Node.Creator.nthRoot(newBase, rootNode);

  return Node.Status.nodeChanged(
    ChangeTypes.GROUP_TERMS_BY_ROOT, node, newNode);
}

// Given an nthRoot node with a constant positive root,
// will convert any grouped factors into exponent nodes as a step
// e.g. nthRoot((2 * 2) * 2, 2) -> nthRoot(2^2 * 2, 2)
function convertMultiplicationToExponent(node) {
  const newNode = clone(node);

  const radicandNode = getRadicandNode(node);

  if (Node.Type.isParenthesis(radicandNode)) {
    const child = radicandNode.content;
    if (isMultiplicationOfEqualNodes(child)) {
      const baseNode = child.args[0];
      const exponentNode = Node.Creator.constant(child.args.length);
      newNode.args[0] = Node.Creator.operator('^', [baseNode, exponentNode]);
      return Node.Status.nodeChanged(
        ChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
    }
  }
  else if (Node.Type.isOperator(radicandNode, '*')) {
    const children = [];
    radicandNode.args.forEach(child => {
      if (Node.Type.isParenthesis(child)) {
        const grandChild = child.content;
        if (isMultiplicationOfEqualNodes(grandChild)) {
          const baseNode = grandChild.args[0];
          const exponentNode = Node.Creator.constant(grandChild.args.length);
          children.push(Node.Creator.operator('^', [baseNode, exponentNode]));
          return;
        }
      }
      children.push(child);
    });

    newNode.args[0] = Node.Creator.operator('*', children);
    return Node.Status.nodeChanged(
      ChangeTypes.CONVERT_MULTIPLICATION_TO_EXPONENT, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Given an nthRoot node with a multiplication under the radicand, will
// distribute the nthRoot to all the arguments under the radicand as a step
// e.g. nthRoot(2 * x^2, 2) -> nthRoot(2) * nthRoot(x^2)
function distributeNthRoot(node) {
  let newNode = clone(node);
  const radicandNode = getRadicandNode(node);
  const rootNode = getRootNode(node);

  const children = [];
  for (let i = 0; i < radicandNode.args.length; i++) {
    const child = radicandNode.args[i];
    children.push(Node.Creator.nthRoot(child, rootNode));
  }

  newNode = Node.Creator.operator('*', children);
  return Node.Status.nodeChanged(
    ChangeTypes.DISTRIBUTE_NTH_ROOT, node, newNode);
}

// Given a multiplication node of nthRoots (with the same root)
// will evaluate the nthRoot of each child as a substep
// e.g. nthRoot(2) * nthRoot(x^2) -> nthRoot(2) * x
function evaluateNthRootForChildren(node) {
  const newNode = clone(node);

  const substeps = [];
  for (let i = 0; i < newNode.args.length; i++) {
    const child = newNode.args[i];
    const childNodeStatus = nthRoot(child);
    if (childNodeStatus.hasChanged()) {
      newNode.args[i] = childNodeStatus.newNode;
      substeps.push(Node.Status.childChanged(newNode, childNodeStatus, i));
    }
  }

  if (substeps.length === 0) {
    return Node.Status.noChange(node);
  }
  else if (substeps.length === 1) {
    return substeps[0];
  }
  else {
    return Node.Status.nodeChanged(
      ChangeTypes.EVALUATE_DISTRIBUTED_NTH_ROOT, node, newNode, true, substeps);
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
    if (Node.Type.isFunction(child, 'nthRoot')) {
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
        radicandArgs[0] : Node.Creator.operator('*', radicandArgs);
      children.push(Node.Creator.nthRoot(radicandNode, rootNode));
    }

    newNode = Node.Creator.operator('*', children);
    if (!newNode.equals(node)) {
      return Node.Status.nodeChanged(
        ChangeTypes.COMBINE_UNDER_ROOT, node, newNode);
    }
  }

  // if there are no items moved out of the root, then nothing has changed
  return Node.Status.noChange(node);
}

// Returns the nthRoot evaluated on a constant node
// Potentially factors the constant node into primes, and calls
// nthRootMultiplication on the new nthRoot
function nthRootConstant(node) {
  let newNode = clone(node);
  const radicandNode = getRadicandNode(node);
  const rootNode = getRootNode(node);

  if (Negative.isNegative(radicandNode)) {
    return Node.Status.noChange(node);
  }
  else if (!Node.Type.isConstant(rootNode) || Negative.isNegative(rootNode)) {
    return Node.Status.noChange(node);
  }

  const radicandValue = parseFloat(radicandNode.value);
  const rootValue = parseFloat(rootNode.value);
  const nthRootValue = math.nthRoot(radicandValue, rootValue);
  const roundedNthRootValue = math.round(nthRootValue);
  // Perfect root e.g. nthRoot(4, 2) = 2
  // nthRoot may have round-off error, so we'll check for perfect roots by rounding to the nearest integer
  // and checking if that value that satisfies the root expression
  if (math.pow(roundedNthRootValue, rootValue) === radicandValue) {
    newNode = Node.Creator.constant(roundedNthRootValue);
    return Node.Status.nodeChanged(
      ChangeTypes.NTH_ROOT_VALUE, node, newNode);
  }
  // Try to find if we can simplify by finding factors that can be
  // pulled out of the radical
  else {
    // convert the number into the product of its prime factors
    const factors = ConstantFactors.getPrimeFactors(radicandValue);
    if (factors.length > 1) {
      let substeps = [];
      const factorNodes = factors.map(Node.Creator.constant);

      newNode.args[0] = Node.Creator.operator('*', factorNodes);
      substeps.push(Node.Status.nodeChanged(
        ChangeTypes.FACTOR_INTO_PRIMES, node, newNode));

      // run nthRoot on the new node
      const nodeStatus = nthRootMultiplication(newNode);
      if (nodeStatus.hasChanged()) {
        substeps = substeps.concat(nodeStatus.substeps);
        newNode = nodeStatus.newNode;

        return Node.Status.nodeChanged(
          ChangeTypes.NTH_ROOT_VALUE, node, newNode, true, substeps);
      }
    }
  }

  return Node.Status.noChange(node);
}

// Helpers

// Given an nthRoot node, will return the root node.
// The root node is the second child of the nthRoot node, but if one doesn't
// exist, we assume it's a square root and return 2.
function getRootNode(node) {
  if (!Node.Type.isFunction(node, 'nthRoot')) {
    throw Error('Expected nthRoot');
  }

  return node.args.length === 2 ? node.args[1] : Node.Creator.constant(2);
}

// Given an nthRoot node, will return the radicand node.
function getRadicandNode(node) {
  if (!Node.Type.isFunction(node, 'nthRoot')) {
    throw Error('Expected nthRoot');
  }

  return node.args[0];
}

// Sorts nodes, ordering constants nodes from smallest to largest and symbol
// nodes after
function sortNodes(a, b) {
  if (Node.Type.isConstant(a) && Node.Type.isConstant(b)) {
    return parseFloat(a.value) - parseFloat(b.value);
  }
  else if (Node.Type.isConstant(a)) {
    return -1;
  }
  else if (Node.Type.isConstant(b)) {
    return 1;
  }
  return 0;
}

// Simple helper function which determines a node is a multiplication node
// of all equal nodes
function isMultiplicationOfEqualNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*') {
    return false;
  }

  const termStrings = node.args.map(print.ascii);

  // return if they are all equal nodes
  return [...new Set(termStrings)].length === 1;
}

module.exports = {
  getRadicandNode,
  getRootNode,
  nthRoot,
};
