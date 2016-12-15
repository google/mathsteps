'use strict';

const math = require('mathjs');
const clone = require('./clone');

const flattenOperands = require('./flattenOperands');
const Fraction = require('./Fraction');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const NodeStatus = require('./NodeStatus');
const print = require('./print');
const removeUnnecessaryParens = require('./removeUnnecessaryParens');

const collectAndCombineLikeTerms = require('./collectAndCombine');
const distribute = require('./distribute');
const evaluateArithmetic = require('./evaluateArithmetic');
const evaluateFunctions = require('./evaluateFunctions');
const simplifyBasics = require('./simplifyBasics');
const simplifyDivision = require('./simplifyDivision');
const simplifyFractions = require('./simplifyFractions');

// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
function simplify(node, debug=false) {
  const steps = stepThrough(node, debug);
  let simplifiedNode;
  if (steps.length > 0) {
    simplifiedNode = steps.pop().newNode;
  }
  else {
    // this will do any necessary flattening/removing parens (which aren't
    // counted as a step)
    simplifiedNode = step(node).newNode;
  }
  // unflatten the node.
  return unflatten(simplifiedNode);
}

// Given a mathjs expression node, steps through simplifying the expression.
// Returns a list of details about each step.
function stepThrough(node, debug=false) {
  if (debug) {
    // eslint-disable-next-line
    console.log('\n\nSimplifying: ' + print(node, false, true));
  }

  if(hasUnsupportedNodes(node)) {
    return [];
  }

  let nodeStatus;
  let steps = [];

  const originalExpressionStr = print(node);
  const MAX_STEP_COUNT = 20;
  let iters = 0;

  // Now, step through the math expression until nothing changes
  nodeStatus = step(node);
  while (nodeStatus.hasChanged()) {
    steps = addStep(steps, nodeStatus, debug);
    nodeStatus.reset();
    nodeStatus = step(nodeStatus.newNode);
    if (iters++ === MAX_STEP_COUNT) {
      // eslint-disable-next-line
      console.error('Math error: Potential infinite loop for expression: ' +
                    originalExpressionStr + ', returning no steps');
      return [];
    }
  }

  return steps;
}

// Given a mathjs expression node, performs a single step to simplify the
// expression. Returns a NodeStatus object.
function step(node) {
  let nodeStatus;

  node = flattenOperands(node);
  node = removeUnnecessaryParens(node, true);

  const simplificationTreeSearches = [
    // Basic simplifications that we always try first e.g. (...)^0 => 1
    simplifyBasics,
    // Simplify any division chains so there's at most one division operation.
    // e.g. 2/x/6 -> 2/(x*6)        e.g. 2/(x/6) => 2 * 6/x
    simplifyDivision,
    // Adding fractions, cancelling out things in fractions
    simplifyFractions,
    // e.g. 2 + 2 => 4
    evaluateArithmetic,
    // e.g. addition: 2x + 4x^2 + x => 4x^2 + 3x
    // e.g. multiplication: 2x * x * x^2 => 2x^3
    collectAndCombineLikeTerms,
    // e.g. (2 + x) / 4 => 2/4 + x/4
    Fraction.breakUpNumeratorTreeSearch,
    // Try distributing into parentheses e.g. 2x*(x+3) -> 2x*x + 2x*3
    Fraction.multiplyFractionsTreeSearch,
    // e.g. (2x + 3)(x + 4) => 2x^2 + 11x + 12
    distribute,
    // e.g. abs(-4) => 4
    evaluateFunctions,
  ];

  for (let i = 0; i < simplificationTreeSearches.length; i++) {
    nodeStatus = simplificationTreeSearches[i](node);
    // Always update node, since there might be changes that didn't count as
    // a step. Remove unnecessary parens, in case one a step results in more
    // parens than needed.
    node = removeUnnecessaryParens(nodeStatus.newNode, true);
    if (nodeStatus.hasChanged()) {
      node = flattenOperands(node);
      nodeStatus.newNode = clone(node);
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
  let substeps = [];
  if (nodeStatus.substeps.length) {
    nodeStatus.substeps.forEach(substepStatus =>
      substeps = addStep(substeps, substepStatus, debug));
  }

  steps.push({
    'changeType': nodeStatus.changeType,
    'oldNode': removeUnnecessaryParens(nodeStatus.oldNode, true),
    'newNode': removeUnnecessaryParens(nodeStatus.newNode, true),
    'substeps': substeps,
    'asciimath': print(nodeStatus.newNode),
  });
  if (debug) {
    // eslint-disable-next-line
    console.log(nodeStatus.changeType);
    // eslint-disable-next-line
    console.log(print(nodeStatus.newNode) + '\n');
  }
  return steps;
}

// Unflattens a node so it is in the math.js style, by printing and parsing it
// again
function unflatten(node) {
  return math.parse(print(node));
}

module.exports = {
  step: step,
  simplify: simplify,
  stepThrough: stepThrough,
};
