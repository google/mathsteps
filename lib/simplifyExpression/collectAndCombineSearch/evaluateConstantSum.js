const addConstantAndFraction = require('../fractionsSearch/addConstantAndFraction');
const addConstantFractions = require('../fractionsSearch/addConstantFractions');
const arithmeticSearch = require('../arithmeticSearch');
const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// Evaluates a sum of constant numbers and integer fractions to a single
// constant number or integer fraction. e.g. e.g. 2/3 + 5 + 5/2 => 49/6
// Returns a Node.Status object.
function evaluateConstantSum(node) {
  if (Node.Type.isParenthesis(node)) {
    node = node.content;
  }
  if (!Node.Type.isOperator(node) || node.op !== '+') {
    return Node.Status.noChange(node);
  }
  if (node.args.some(node => !Node.Type.isConstantOrConstantFraction(node))) {
    return Node.Status.noChange(node);
  }

  // functions needed to evaluate the sum
  const summingFunctions = [
    arithmeticSearch,
    addConstantFractions,
    addConstantAndFraction,
  ];
  for (let i = 0; i < summingFunctions.length; i++) {
    const status = summingFunctions[i](node);
    if (status.hasChanged()) {
      if (Node.Type.isConstantOrConstantFraction(status.newNode)) {
        return status;
      }
    }
  }

  let newNode = clone(node);
  const substeps = [];
  let status;

  // STEP 1: group fractions and constants separately
  status = groupConstantsAndFractions(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  const constants = newNode.args[0];
  const fractions = newNode.args[1];

  // STEP 2A: evaluate arithmetic IF there's > 1 constant
  // (which is the case if it's a list surrounded by parenthesis)
  if (Node.Type.isParenthesis(constants)) {
    const constantList = constants.content;
    const evaluateStatus = arithmeticSearch(constantList);
    status = Node.Status.childChanged(newNode, evaluateStatus, 0);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // STEP 2B: add fractions IF there's > 1 fraction
  // (which is the case if it's a list surrounded by parenthesis)
  if (Node.Type.isParenthesis(fractions)) {
    const fractionList = fractions.content;
    const evaluateStatus = addConstantFractions(fractionList);
    status = Node.Status.childChanged(newNode, evaluateStatus, 1);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // STEP 3: combine the evaluated constant and fraction
  // the fraction might have simplified to a constant (e.g. 1/3 + 2/3 -> 2)
  // so we just call evaluateConstantSum again to cycle through
  status = evaluateConstantSum(newNode);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  return Node.Status.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, substeps);
}

// If we can't combine using one of those functions, there's a mix of > 2
// fractions and constants. So we need to group them together so we can later
// add them.
// Expects a node that is a sum of integer fractions and constants.
// Returns a Node.Status object.
// e.g. 2/3 + 5 + 5/2 => (2/3 + 5/2) + 5
function groupConstantsAndFractions(node) {
  let fractions = node.args.filter(Node.Type.isIntegerFraction);
  let constants = node.args.filter(Node.Type.isConstant);

  if (fractions.length === 0 || constants.length === 0) {
    throw Error('expected both integer fractions and constants, got ' + node);
  }

  if (fractions.length + constants.length !== node.args.length) {
    throw Error('can only evaluate integer fractions and constants');
  }

  constants = constants.map(node => {
    // set the changeGroup - this affects both the old and new node
    node.changeGroup = 1;
    // clone so that node and newNode aren't stored in the same memory
    return clone(node);
  });
  // wrap in parenthesis if there's more than one, to group them
  if (constants.length > 1) {
    constants = Node.Creator.parenthesis(Node.Creator.operator('+', constants));
  }
  else {
    constants = constants[0];
  }

  fractions = fractions.map(node => {
    // set the changeGroup - this affects both the old and new node
    node.changeGroup = 2;
    // clone so that node and newNode aren't stored in the same memory
    return clone(node);
  });
  // wrap in parenthesis if there's more than one, to group them
  if (fractions.length > 1) {
    fractions = Node.Creator.parenthesis(Node.Creator.operator('+', fractions));
  }
  else {
    fractions = fractions[0];
  }

  const newNode = Node.Creator.operator('+', [constants, fractions]);
  return Node.Status.nodeChanged(
    ChangeTypes.COLLECT_LIKE_TERMS, node, newNode);
}

module.exports = evaluateConstantSum;
