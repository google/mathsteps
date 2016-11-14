'use strict';

const math = require('../../../index');

const collectLikeTerms = require('./LikeTermCollector').collectLikeTermsDFS;
const distribute = require('./distribute');
const flattenOperands = require('./flattenOperands');
const Fraction = require('./Fraction');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const MathChangeTypes = require('./MathChangeTypes');
const NodeStatus = require('./NodeStatus');
const NodeType = require('./NodeType');
const prettyPrint = require('./prettyPrint');
const removeUnnecessaryParens = require('./removeUnnecessaryParens');
const simplifyDivision = require('./simplifyDivision');
const simplifyOperations = require('./simplifyOperations');

// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
function simplify(node, debug=false) {
  const steps = stepThrough(node, debug);
  if (steps.length > 0) {
    return steps.pop().newNode;
  }
  else {
    // this will do any necessary flattening/removing parens (which aren't
    // counted as a step)
    return step(node).newNode;
  }
}

// Given a mathjs expression node, steps through simplifying the expression.
// Returns a list of details about each step.
// If firstTime=false, then the simplification is part of a larger change
// and the node is probably flattened therefore we can't know for sure if
// +- was the actual user input and it will not be converted to -
function stepThrough(node, debug=false, firstTime=true) {
  if (debug) {
    console.log('\n\nSimplifying: ' + prettyPrint(node, false, true));
  }

  if(hasUnsupportedNodes(node)) {
    return [];
  }

  let nodeStatus;
  let steps = [];

  // Before simplifying, check for any instances of + - that can be simplified
  // e.g. 2 + (-3) -> 2 - 3
  if (firstTime) {
    nodeStatus = plusMinusToMinus(node);
    if (nodeStatus.hasChanged()) {
      steps = addStep(steps, nodeStatus, debug);
    }
    node = nodeStatus.newNode;
  }

  const originalExpressionStr = prettyPrint(node);
  const MAX_STEP_COUNT = 100;
  let iters = 0

  // Now, step through the math expression until nothing changes
  nodeStatus = step(node);
  while (nodeStatus.hasChanged()) {
    steps = addStep(steps, nodeStatus, debug);
    nodeStatus.resetchangeGroups();
    nodeStatus = step(nodeStatus.newNode);
    if (iters++ === MAX_STEP_COUNT) {
      throw Error('Potential infinite loop for expression: ' +
                  originalExpressionStr);
    }
  }

  // Update the last step, in case we returned something simplified the last
  // time that didn't count as a step.
  if (steps.length > 0) {
    steps[steps.length - 1].asciimath = prettyPrint(nodeStatus.newNode);
    steps[steps.length - 1].latex = prettyPrint(nodeStatus.newNode, true);
    steps[steps.length - 1].newNode = nodeStatus.newNode;
  }

  return steps;
}

// Given a mathjs expression node, performs a single step to simplify the
// expression. Returns a NodeStatus object.
function step(node) {
  let nodeStatus;

  // Remove unnecessary parens, but don't count it as a step
  // TODO: count this as a change that isn't a step.
  node = removeUnnecessaryParens(node, true);

  const simplificationFunctions = [
    // Simplify any division chains into a single division operation.
    simplifyDivision,
    // Try combining/cancelling out/simplifying the expression
    simplifyOperations,
    // Then see if any like terms can be collected
    collectLikeTerms,
    Fraction.breakUpNumeratorDFS,
    // Try distributing into parentheses e.g. 2x*(x+3) -> 2x*x + 2x*3
    distribute,
    Fraction.multiplyFractionsDFS,
  ];

  for (let i = 0; i < simplificationFunctions.length; i++) {
    nodeStatus = simplificationFunctions[i](node);
    // Always update node, since there might be changes that didn't count as
    // a step. Remove unnecessary parens, in case one a step results in more
    // parens than needed.
    node = removeUnnecessaryParens(nodeStatus.newNode, true);
    if (nodeStatus.hasChanged()) {
      node = flattenOperands(node);
      nodeStatus.newNode = node;
      return nodeStatus;
    }
    else {
      node = flattenOperands(node);

    }
  }
  return NodeStatus.noChange(node);
}

// Adds a new step to the array, given details of a change that just happened.
// Returns the new steps array.
function addStep(steps, nodeStatus, debug) {
  let explanation = nodeStatus.changeType;
  let asciimath = prettyPrint(nodeStatus.newNode);
  let latex = prettyPrint(nodeStatus.newNode, true);

  steps.push({
    'explanation': explanation,
    'asciimath': asciimath,
    'latex': latex
  });
  if (debug) {
    if (nodeStatus.oldNode) {
      const before = nodeStatus.oldNode;
      const after = nodeStatus.newNode;
      before.filter(node => node.changeGroup).forEach(change => {
        console.log('before change: ' + prettyPrint(change) +
                    ' changeGroup: ' + change.changeGroup);
      })
      console.log(explanation);
      after.filter(node => node.changeGroup).forEach(change => {
        console.log('after change: ' + prettyPrint(change) +
                    ' changeGroup: ' + change.changeGroup);
      })
    }
    // TODO: figure out what changeGroup looks like for this, if we want one
    else if (nodeStatus.changeType !== MathChangeTypes.RESOLVE_ADD_UNARY_MINUS) {
      throw Error('no change groups for ' + nodeStatus.changeType);
    }
    console.log(asciimath + '\n')
  }
  return steps;
}

// Check for any instances of + - that can be simplified e.g. 2 + (-3) -> 2 - 3
// changing this will count as a step, but we won't actually change the tree
// (because secretly to the user, before all steps we convert subtraction into
// adding unary minus)
function plusMinusToMinus(node) {
  // First we have to remove uncessary parens.
  node = removeUnnecessaryParens(node, true);
  // Then look for + -
  const exprString = prettyPrint(node, false, true);
  if (exprString.match(/\+ \-/g)) {
    // TODO: figure out what changeGroup looks like for this, if we want one
    return new NodeStatus(MathChangeTypes.RESOLVE_ADD_UNARY_MINUS, null, node);
  }
  else {
    return NodeStatus.noChange(node);
  }
}

module.exports = {
  step: step,
  simplify: simplify,
  stepThrough: stepThrough,
}
