import {print, parse} from 'math-parser';
import {canApplyRule, applyRule} from 'math-rules';
import {rules} from 'math-rules';
import {build, query} from 'math-nodes';
import {Status} from '../Status.js';
import simplifyExpressionString from './index.js';

// Checks if rules from math-rules can be applied to nodes
function apply(name, node){
  const rule = rules[name];
  if (canApplyRule(rule, node)){
    const newNode = applyRule(rule, node);
    return Status.nodeChanged(
      name, node, newNode
    );
  } 
  return Status.noChange(node);
}

const BASIC_FUNCTIONS = {
  'MULTIPLY_BY_ZERO': 'MULTIPLY_BY_ZERO',
  'REDUCE_EXPONENT_BY_ZERO': 'REDUCE_EXPONENT_BY_ZERO'
}

export default function search(node, simplification){
  console.log(simplification);
  for (var rule in simplification){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}
//const search = TreeSearch.preOrder(basics);

//console.log(basics(parse('2 ^ 0')));
console.log(simplifyExpressionString('2^0', true));
//console.log(Status.resetChangeGroups(parse('2^0')));
