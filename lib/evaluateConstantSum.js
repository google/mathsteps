'use strict';

const clone = require('clone');

const ConstantFraction = require('./ConstantFraction');
const evaluateArithmetic = require('./evaluateArithmetic');
const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./NodeCreator');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');

// Evaluates a sum of constant numbers and integer fractions to a single
// constant number or integer fraction. e.g. e.g. 2/3 + 5 + 5/2 => 49/6
// Returns a NodeStatus object.
function evaluateConstantSum(node) {
  if (NodeType.isParenthesis(node)) {
    node = node.content;
  }
  if (!NodeType.isOperator(node) || node.op !== '+') {
    return NodeStatus.noChange(node);
  }
  if (node.args.some(node => !NodeType.isConstantOrConstantFraction(node))) {
    return NodeStatus.noChange(node);
  }

  // functions needed to evaluate the sum
  const summingFunctions = [
    evaluateArithmetic,
    ConstantFraction.addConstantFractions,
    ConstantFraction.addConstantAndFraction,
  ];
  for (let i = 0; i < summingFunctions.length; i++) {
    const status = summingFunctions[i](node);
    if (status.hasChanged()) {
      if (NodeType.isConstantOrConstantFraction(status.newNode)) {
        return status;
      }
    }
  }

  let oldNode = clone(node, false);
  const subSteps = [];

  // STEP 1: group fractions and constants separately
  let status = groupConstantsAndFractions(oldNode);
  subSteps.push(status);

  let newNode = NodeStatus.resetChangeGroups(status.newNode);
  const constants = newNode.args[0];
  const fractions = newNode.args[1];

  // STEP 2A: evaluate arithmetic IF there's > 1 constant
  // (which is the case if it's a list surrounded by parenthesis)
  if (NodeType.isParenthesis(constants)) {
    const constantList = constants.content;
    const evaluateStatus = evaluateArithmetic(constantList);
    status = NodeStatus.childChanged(newNode, evaluateStatus, 0);
    subSteps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 2B: add fractions IF there's > 1 fraction
  // (which is the case if it's a list surrounded by parenthesis)
  if (NodeType.isParenthesis(fractions)) {
    const fractionList = fractions.content;
    const evaluateStatus = ConstantFraction.addConstantFractions(fractionList);
    status = NodeStatus.childChanged(newNode, evaluateStatus, 1);
    subSteps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // STEP 3: combine the evaluated constant and fraction
  // the fraction might have simplified to a constant (e.g. 1/3 + 2/3 -> 2)
  // so we just call evaluateConstantSum again to cycle through
  status = evaluateConstantSum(newNode);
  subSteps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  return NodeStatus.nodeChanged(
    MathChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, subSteps);
}

// If we can't combine using one of those functions, there's a mix of > 2
// fractions and constants. So we need to group them together so we can later
// add them.
// Expects a node that is a sum of integer fractions and constants.
// Returns a NodeStatus object.
// e.g. 2/3 + 5 + 5/2 => (2/3 + 5/2) + 5
function groupConstantsAndFractions(node) {
  let fractions = node.args.filter(NodeType.isIntegerFraction);
  let constants = node.args.filter(NodeType.isConstant);

  if (fractions.length === 0 || constants.length === 0) {
    throw Error('expected both integer fractions and constants, got ' + node);
  }

  if (fractions.length + constants.length !== node.args.length) {
    throw Error('can only evaluate integer fractions and constants');
  }

  constants = constants.map(node => {
    // set the changeGroup - this affects both the old and new node
    node.changeGroup = 1;
    // clone so that oldNode and newNode aren't stored in the same memory
    return clone(node, false);
  });
  // wrap in parenthesis if there's more than one, to group them
  if (constants.length > 1) {
    constants = NodeCreator.parenthesis(NodeCreator.operator('+', constants));
  }
  else {
    constants = constants[0];
  }

  fractions = fractions.map(node => {
    // set the changeGroup - this affects both the old and new node
    node.changeGroup = 2;
    // clone so that oldNode and newNode aren't stored in the same memory
    return clone(node, false);
  });
  // wrap in parenthesis if there's more than one, to group them
  if (fractions.length > 1) {
    fractions = NodeCreator.parenthesis(NodeCreator.operator('+', fractions));
  }
  else {
    fractions = fractions[0];
  }

  const oldNode = node;
  const newNode = NodeCreator.operator('+', [constants, fractions]);

  return NodeStatus.nodeChanged(
    MathChangeTypes.COLLECT_LIKE_TERMS, oldNode, newNode);
}

module.exports = evaluateConstantSum;
