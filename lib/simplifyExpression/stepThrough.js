import {Status} from '../Status.js';
import {print, parse} from 'math-parser';
import {rules, flattenOperands, applyRule} from 'math-rules';
import {basicsSearch,
        divisionSearch,
        fractionsSearch,
        collectAndCombineSearch,
        arithmeticSearch,
        breakUpNumeratorSearch,
        multiplyFractionsSearch,
        distributeSearch,
        functionsSearch} from './search.js';
import clone from '../clone.js';

// Given a math-parser expression node, steps through simplifying the expression.
// Returns a list of details about each step.
export default function stepThrough(node, debug=true) {
  if (debug) {
    // eslint-disable-next-line
    console.log('\n\nSimplifying: ' + print(node));
  }

  let nodeStatus;
  const steps = [];

  const originalExpressionStr = print(node);
  const MAX_STEP_COUNT = 20;
  let iters = 0;

  // Now, step through the math expression until nothing changes
  nodeStatus = step(node);
  while (nodeStatus.hasChanged()){
    if (debug){
      logSteps(nodeStatus);
    }
    steps.push(nodeStatus);

    node = Status.resetChangeGroups(nodeStatus.newNode);
    nodeStatus = step(node);

    if (iters++ == MAX_STEP_COUNT){
      console.error('Math-error: Potential infinite loop for expression: ' + originalExpressionStr + ', returning no steps');
      return [];
    }
  }

  return steps;
}

// Given a math-parser expression node, performs a single step to simplify the
// expression. Returns a Node.Status object.
function step(node){
  let nodeStatus;

  node = flattenOperands(node);

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
    // node = removeUnnecessaryParens(nodeStatus.newNode, true);

    if (nodeStatus.hasChanged()){
      return nodeStatus
    } else {
      node = flattenOperands(node);
    }
  }
  return Status.noChange(node);
}

function logSteps(nodeStatus) {
  // eslint-disable-next-line
  console.log(nodeStatus.changeType);
  // eslint-disable-next-line
  console.log(print(nodeStatus.newNode) + '\n');

  if (nodeStatus.substeps.length > 0) {
    // eslint-disable-next-line
    console.log('\nsubsteps: ');
    nodeStatus.substeps.forEach(substep => substep);
  }
}
