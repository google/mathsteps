import {query, build} from 'math-nodes';
import {Status} from '../Status.js';
import {print, parse} from 'math-parser';
import {rules, flattenOperands, applyRule} from 'math-rules';
import {applyRules} from './search.js';
import TreeSearch from '../TreeSearch.js';
import search from './search.js';
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

  const simplificationTreeSearches = {
    'basic' : 'preOrder',
    'division' : 'preOrder',
    'fractions' : 'preOrder',
    'arithmetic' : 'postOrder',
    'collectAndCombine' : 'postOrder',
    'breakUpNumerator' : 'postOrder',
    'multiplyFractions' : 'postOrder',
    'distribute' : 'postOrder',
    'functions' : 'postOrder'
  };

  for (const simplification in simplificationTreeSearches){
    if (simplificationTreeSearches[simplification] == 'preOrder'){
      nodeStatus = TreeSearch.preOrder(search)(node, simplification);
    } else {
      nodeStatus = TreeSearch.postOrder(search)(node, simplification);
    }
    if (nodeStatus.hasChanged()){
      node = flattenOperands(node);
      nodeStatus.newNode = clone(node);
      return nodeStatus;
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
