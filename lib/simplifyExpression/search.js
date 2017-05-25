import {canApplyRule, applyRule, rules} from 'math-rules';
import {Status} from '../Status.js';
import SimplifyTypes from './SimplifyTypes.js';
import {parse, print} from 'math-parser'

// Checks if rules from math-rules can be applied to nodes
function apply(name, node){
  const rule = rules[name];
  delete node.changeGroup
  if (canApplyRule(rule, node)){
    const newNode = applyRule(rule, node);

    return Status.nodeChanged(
      name, node, newNode
    );
  }
  return Status.noChange(node);
}

function tryRules(node, functions) {
  for (var rule in functions){
    const nodeStatus = apply(rule, node);
    
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

const basics =
      (node) => tryRules(node, SimplifyTypes.BASIC_FUNCTIONS);

const division =
      (node) => tryRules(node, SimplifyTypes.DIVISION_FUNCTIONS)

const fractions =
      (node) => tryRules(node, SimplifyTypes.FRACTION_FUNCTIONS)

const collectAndCombine =
      (node) => tryRules(node, SimplifyTypes.COLLECT_AND_COMBINE_FUNCTIONS)

const arithmetic =
      (node) => tryRules(node, SimplifyTypes.ARITHMETIC_FUNCTIONS)

const breakUpNumerator =
      (node) => tryRules(node, SimplifyTypes.BREAK_UP_NUMERATOR_FUNCTIONS)

const multiplyFractions =
      (node) => tryRules(node, SimplifyTypes.MULTIPLY_FRACTIONS_FUNCTIONS)

const distribute =
      (node) => tryRules(node, SimplifyTypes.DISTRIBUTE_FUNCTIONS)

const functions =
      (node) => tryRules(node, SimplifyTypes.FUNCTIONS_FUNCTIONS)

module.exports = {
  basics,
  division,
  fractions,
  collectAndCombine,
  arithmetic,
  breakUpNumerator,
  multiplyFractions,
  distribute,
  functions
}
