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

  // Since math-parser automatically flattens when it parses, there isn't
  // usually need to flatten the tree, and want to keep structure
  // e.g. (x + x) + (2 + 3) is already set up for collecting like terms,
  // so we wouldn't want to flatten it to (x + x + 2 + 3)
  // However, if no steps can be made (i.e. nodeStatus.hasChanged is false)
  // then we should try flattening and see if that opens more options for
  // simplification steps.
  // e.g. (x + 5) + 6 can't collect and combine until flattend into (x + 5 + 6)
  // TODO: should this be an explicit step? or is not really step worthy
  // TODO: should probably also combine with removeUnnecessaryParens? it does
  // a few things not related to parens though, probably should split that out?
  let justFlattened = false;

  while (nodeStatus.hasChanged() || !justFlattened) {
    if (nodeStatus.hasChanged()) {
      if (debug) {
        logSteps(nodeStatus);
      }
      steps.push(removeUnnecessaryParensInStep(nodeStatus));
      node = Status.resetChangeGroups(nodeStatus.newNode);
      if (nodeStatus.substeps.length > 0) {
        nodeStatus.substeps
      }
      justFlattened = false;
    }
    else {
      node = flattenOperands(node);
      // we flatten the "new node" in the previous step for consistency,
      // since it should be the same as the next step's "old node"
      const lastStep = steps.pop();
      if (lastStep) {
        lastStep.newNode = flattenOperands(lastStep.newNode);
        steps.push(lastStep);
      }
      justFlattened = true;
    }

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
      nodeStatus.newNode = clone(node);
      return nodeStatus;
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

function logSteps(nodeStatus, indentation=0) {
  const whitespace = '    '.repeat(indentation);
  // eslint-disable-next-line
  console.log(whitespace + nodeStatus.changeType);
  // eslint-disable-next-line
  console.log(whitespace + print.ascii(nodeStatus.newNode) + '\n');

  if (nodeStatus.substeps.length > 0) {
    // eslint-disable-next-line
    console.log('\n' + whitespace + 'substeps: ');
    nodeStatus.substeps.forEach(substep => logSteps(substep, indentation + 1));
  }
}

module.exports = stepThrough;
