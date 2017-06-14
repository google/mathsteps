import {canApplyRule, applyRule, rules} from 'math-rules';
import {Status} from '../Status.js';
import SimplifyTypes from './SimplifyTypes.js';
import TreeSearch from '../TreeSearch.js'
import {parse, print} from 'math-parser'

// Checks if rules from math-rules can be applied to nodes
function apply(name, node){
  const rule = rules[name];
    delete node.changeGroup
    console.log(name)
    console.log(print(node))
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

const basics = (node) => tryRules(node, SimplifyTypes.BASIC_FUNCTIONS);

const basicsSearch = TreeSearch.preOrder(basics)

const division = (node) => tryRules(node, SimplifyTypes.DIVISION_FUNCTIONS)

const divisionSearch = TreeSearch.preOrder(division)

const fractions = (node) => tryRules(node, SimplifyTypes.FRACTION_FUNCTIONS)

const fractionsSearch = TreeSearch.preOrder(fractions) 

const collectAndCombine = (node) => tryRules(node, SimplifyTypes.COLLECT_AND_COMBINE_FUNCTIONS)

const collectAndCombineSearch = TreeSearch.postOrder(collectAndCombine)

const arithmetic = (node) => tryRules(node, SimplifyTypes.ARITHMETIC_FUNCTIONS)

const arithmeticSearch = TreeSearch.postOrder(arithmetic)

const breakUpNumerator = (node) => tryRules(node, SimplifyTypes.BREAK_UP_NUMERATOR_FUNCTIONS)

const breakUpNumeratorSearch = TreeSearch.postOrder(breakUpNumerator)

const multiplyFractions = (node) => tryRules(node, SimplifyTypes.MULTIPLY_FRACTIONS_FUNCTIONS)

const multiplyFractionsSearch = TreeSearch.postOrder(multiplyFractions)

const distribute = (node) => tryRules(node, SimplifyTypes.DISTRIBUTE_FUNCTIONS)

const distributeSearch = TreeSearch.postOrder(distribute)

const functions = (node) => tryRules(node, SimplifyTypes.FUNCTIONS_FUNCTIONS)

const functionsSearch = TreeSearch.postOrder(functions)

module.exports = {
  basicsSearch,
  divisionSearch,
  fractionsSearch,
  collectAndCombineSearch,
  arithmeticSearch,
  breakUpNumeratorSearch,
  multiplyFractionsSearch,
  distributeSearch,
  functionsSearch
}
