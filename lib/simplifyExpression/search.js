import {print, parse} from 'math-parser';
import {canApplyRule, applyRule, rules} from 'math-rules';
import {Status} from '../Status.js';
import simplifyExpressionString from './index.js';
import SimplifyTypes from './SimplifyTypes.js';

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

export function basics(node){
  for (var rule in SimplifyTypes.BASIC_FUNCTIONS){
    const nodeStatus = apply(rule, node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function division(node){
  for (var rule in SimplifyTypes.DIVISION_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);

}

export function fractions(node){
  for (var rule in SimplifyTypes.FRACTION_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function collectAndCombine(node){
  for (var rule in SimplifyTypes.COLLECT_AND_COMBINE_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function arithmetic(node){
  for (var rule in SimplifyTypes.ARITHMETIC_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function breakUpNumerator(node){
  for (var rule in SimplifyTypes.BREAK_UP_NUMERATOR_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function multiplyFractions(node){
  for (var rule in SimplifyTypes.MULTIPLY_FRACTIONS_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function distribute(node){
  for (var rule in SimplifyTypes.DISTRIBUTE_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

export function functions(node){
  for (var rule in SimplifyTypes.FUNCTIONS_FUNCTIONS){
    const nodeStatus = apply(rule, node); 
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    } else {
      node = nodeStatus.newNode;
    }
  }
  return Status.noChange(node);
}

console.log(simplifyExpressionString('2/3/4', true));
console.log(simplifyExpressionString('x/(2/3)', true));
console.log(simplifyExpressionString('-2/-3', true));
