const checks = require('../checks');
const Node = require('../node');
const Status = require('../node/Status');

const arithmeticSearch = require('./arithmeticSearch');
const basicsSearch = require('./basicsSearch');
const breakUpNumeratorSearch = require('./breakUpNumeratorSearch');
const collectAndCombineSearch = require('./collectAndCombineSearch');
const distributeSearch = require('./distributeSearch');
const divisionSearch = require('./divisionSearch');
const fractionsSearch = require('./fractionsSearch');
const functionsSearch = require('./functionsSearch');
const multiplyFractionsSearch = require('./multiplyFractionsSearch');

const clone = require('../util/clone');
const flattenOperands = require('../util/flattenOperands');
const print = require('../util/print');
const removeUnnecessaryParens = require('../util/removeUnnecessaryParens');

// Given a mathjs expression node, steps through simplifying the expression.
// Returns a list of details about each step.
function stepThrough(node, debug=false) {
  if (debug) {
    // eslint-disable-next-line
    console.log('\n\nSimplifying: ' + print.ascii(node, false, true));
  }

  if (checks.hasUnsupportedNodes(node)) {
    return [];
  }

  let nodeStatus;
  const steps = [];

  const originalExpressionStr = print.ascii(node);
  const MAX_STEP_COUNT = 20;
  let iters = 0;

  // Now, step through the math expression until nothing changes
  nodeStatus = step(node);
  while (nodeStatus.hasChanged()) {
    if (debug) {
      logSteps(nodeStatus);
    }
    steps.push(removeUnnecessaryParensInStep(nodeStatus));

    node = Status.resetChangeGroups(nodeStatus.newNode);
    nodeStatus = step(node);

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
// expression. Returns a Node.Status object.
function step(node) {
  let nodeStatus;

  node = flattenOperands(node);
  node = removeUnnecessaryParens(node, true);

  const simplificationTreeSearches = [
    // Basic simplifications that we always try first e.g. (...)^0 => 1
    basicsSearch,
    // Simplify any division chains so there's at most one division operation.
    // e.g. 2/x/6 -> 2/(x*6)        e.g. 2/(x/6) => 2 * 6/x
    divisionSearch,
    // Adding fractions, cancelling out things in fractions
    fractionsSearch,
    // e.g. addition of polynomial terms: 2x + 4x^2 + x => 4x^2 + 3x
    // e.g. multiplication of polynomial terms: 2x * x * x^2 => 2x^3
    // e.g. multiplication of constants: 10^3 * 10^2 => 10^5
    collectAndCombineSearch,
    // e.g. 2 + 2 => 4
    arithmeticSearch,
    // e.g. (2 + x) / 4 => 2/4 + x/4
    breakUpNumeratorSearch,
    // e.g. 3/x * 2x/5 => (3 * 2x) / (x * 5)
    multiplyFractionsSearch,
    // e.g. (2x + 3)(x + 4) => 2x^2 + 11x + 12
    distributeSearch,
    // e.g. abs(-4) => 4
    functionsSearch,
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
  return Node.Status.noChange(node);
}

// Removes unnecessary parens throughout the steps.
// TODO: Ideally this would happen in NodeStatus instead.
function removeUnnecessaryParensInStep(nodeStatus) {
  if (nodeStatus.substeps.length > 0) {
    nodeStatus.substeps.map(removeUnnecessaryParensInStep);
  }

  nodeStatus.oldNode = removeUnnecessaryParens(nodeStatus.oldNode, true);
  nodeStatus.newNode = removeUnnecessaryParens(nodeStatus.newNode, true);
  return nodeStatus;
}

function logSteps(nodeStatus) {
  // eslint-disable-next-line
  console.log(nodeStatus.changeType);
  // eslint-disable-next-line
  console.log(print.ascii(nodeStatus.newNode) + '\n');

  if (nodeStatus.substeps.length > 0) {
    // eslint-disable-next-line
    console.log('\nsubsteps: ');
    nodeStatus.substeps.forEach(substep => substep);
  }
}

module.exports = stepThrough;
