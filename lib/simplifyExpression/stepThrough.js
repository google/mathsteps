import {Status} from '../Status.js';
import {print, parse} from 'math-parser';
import {rules, flattenOperands, applyRule} from 'math-rules';
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
    //console.log(nodeStatus.newNode);

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
    basics,
    division,
    arithmetic,
    collectAndCombine,
    // arithmetic - postORder, basics - preOrder, breakup - post, collect - post, distribute - post,
    // division - pre, fractions - pre, functions - post, multiplyFractions - post
  ];

  for (let i = 0; i < simplificationTreeSearches.length; i++){
    let nodeStatus; 
    if(simplificationTreeSearches[i] === basics ||
       simplificationTreeSearches[i] === division ||
       simplificationTreeSearches[i] === fractions ||
       simplificationTreeSearches[i] === arithmetic) {
      nodeStatus = TreeSearch.preOrder(simplificationTreeSearches[i])(node);
    } else {
      nodeStatus = TreeSearch.postOrder(simplificationTreeSearches[i])(node);
    }

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
