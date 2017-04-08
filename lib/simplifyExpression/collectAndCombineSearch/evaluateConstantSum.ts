import addConstantAndFraction = require('../fractionsSearch/addConstantAndFraction');
import addConstantFractions = require('../fractionsSearch/addConstantFractions');
import arithmeticSearch = require('../arithmeticSearch');
import clone = require('../../util/clone');
import ChangeTypes = require('../../ChangeTypes');
import mathNode = require('../../mathnode');

// Evaluates a sum of constant numbers and integer fractions to a single
// constant number or integer fraction. e.g. e.g. 2/3 + 5 + 5/2 => 49/6
// Returns a mathNode.Status object.
function evaluateConstantSum(node: any);
function evaluateConstantSum(node) {
  if (mathNode.Type.isParenthesis(node)) {
    node = node.content;
  }
  if (!mathNode.Type.isOperator(node) || node.op !== '+') {
    return mathNode.Status.noChange(node);
  }
  if (node.args.some(node => !mathNode.Type.isConstantOrConstantFraction(node))) {
    return mathNode.Status.noChange(node);
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
      if (mathNode.Type.isConstantOrConstantFraction(status.newNode)) {
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
  newNode = mathNode.Status.resetChangeGroups(status.newNode);

  const constants = newNode.args[0];
  const fractions = newNode.args[1];

  // STEP 2A: evaluate arithmetic IF there's > 1 constant
  // (which is the case if it's a list surrounded by parenthesis)
  if (mathNode.Type.isParenthesis(constants)) {
    const constantList = constants.content;
    const evaluateStatus = arithmeticSearch(constantList);
    status = mathNode.Status.childChanged(newNode, evaluateStatus, 0);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
  }

  // STEP 2B: add fractions IF there's > 1 fraction
  // (which is the case if it's a list surrounded by parenthesis)
  if (mathNode.Type.isParenthesis(fractions)) {
    const fractionList = fractions.content;
    const evaluateStatus = addConstantFractions(fractionList);
    status = mathNode.Status.childChanged(newNode, evaluateStatus, 1);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
  }

  // STEP 3: combine the evaluated constant and fraction
  // the fraction might have simplified to a constant (e.g. 1/3 + 2/3 -> 2)
  // so we just call evaluateConstantSum again to cycle through
  status = evaluateConstantSum(newNode);
  substeps.push(status);
  newNode = mathNode.Status.resetChangeGroups(status.newNode);

  return mathNode.Status.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, substeps);
}

// If we can't combine using one of those functions, there's a mix of > 2
// fractions and constants. So we need to group them together so we can later
// add them.
// Expects a node that is a sum of integer fractions and constants.
// Returns a mathNode.Status object.
// e.g. 2/3 + 5 + 5/2 => (2/3 + 5/2) + 5
function groupConstantsAndFractions(node: any);
function groupConstantsAndFractions(node) {
  let fractions = node.args.filter(mathNode.Type.isIntegerFraction);
  let constants = node.args.filter(mathNode.Type.isConstant);

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
    constants = mathNode.Creator.parenthesis(mathNode.Creator.operator('+', constants));
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
    fractions = mathNode.Creator.parenthesis(mathNode.Creator.operator('+', fractions));
  }
  else {
    fractions = fractions[0];
  }

  const newNode = mathNode.Creator.operator('+', [constants, fractions]);
  return mathNode.Status.nodeChanged(
    ChangeTypes.COLLECT_LIKE_TERMS, node, newNode);
}

export = evaluateConstantSum;
