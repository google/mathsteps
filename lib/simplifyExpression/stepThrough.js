import {query, build} from 'math-nodes';
import {Status} from '../Status.js';
import {print, parse} from 'math-parser';
import {rules, flattenOperands, applyRule} from 'math-rules';
import {applyRules} from './search.js';
import TreeSearch from '../TreeSearch.js';
import {basics,
        division,
        fractions,
        collectAndCombine,
        arithmetic,
        breakUpNumerator,
        multiplyFractions,
        functions} from './search.js';
import clone from '../clone.js';

// Given a math-parser expression node, steps through simplifying the expression.
// Returns a list of details about each step.
export default function stepThrough(node, debug=false) {
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
  console.log(node);
  const simplificationTreeSearches = [
    // Basic simplifications that we always try first e.g. (...)^0 => 1
    basics,
    division,
    fractions,
    breakUpNumerator,
    multiplyFractions,
    /*
    // Simplify any division chains so there's at most one division operation.
    // e.g. 2/x/6 -> 2/(x*6)        e.g. 2/(x/6) => 2 * 6/x
    division,
    // Adding fractions, cancelling out things in fractions
    fractions,
    // e.g. addition of polynomial terms: 2x + 4x^2 + x => 4x^2 + 3x
    // e.g. multiplication of polynomial terms: 2x * x * x^2 => 2x^3
    // e.g. multiplication of constants: 10^3 * 10^2 => 10^5
    collectAndCombine,
    // e.g. 2 + 2 => 4
    */
    /*
    //arithmetic,
    // e.g. (2 + x) / 4 => 2/4 + x/4
    //breakUpNumerator,
    // e.g. 3/x * 2x/5 => (3 * 2x) / (x * 5)
    //multiplyFractions,
    // e.g. (2x + 3)(x + 4) => 2x^2 + 11x + 12
    //distribute,
    // e.g. abs(-4) => 4
    //functions,
    */
  ];

  for (let i = 0; i < simplificationTreeSearches.length; i++){
    console.log(simplificationTreeSearches[i] == basics);
    nodeStatus = TreeSearch.preOrder(simplificationTreeSearches[i])(node);
  }
  if (nodeStatus.hasChanged()){
    node = flattenOperands(node);
    nodeStatus.newNode = clone(node);
    return nodeStatus;
  } else {
    node = flattenOperands(node);
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
