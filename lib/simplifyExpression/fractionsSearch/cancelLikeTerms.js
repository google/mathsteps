const divideByGCD = require('./divideByGCD');
const math = require('mathjs');
const print = require('../../util/print');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const Node = require('../../node');

function getContent(node) {
  return Node.Type.isParenthesis(node)
    ? node.content
    : node;
}

/*
  Given an array of nodes, return a dictionary and a list of constant terms.
  The dictionary will map a base to its largest exponent value (if
  the term is a power node, otherwise, the value will be 1)

  e.g. [2, 3] -> map : {}, constants: [2, 3]
  e.g. [x, x^2] -> map : {x : 2} <- x is the base and 2 is the highest exponent
  with x as the base
  e.g. [x, (x + 1)^2] -> map: {x: 1, x + 1: 2}
  e.g. [2, 3x^2] -> map: {x: 2}, constants: [2, 3]
*/
function exponentMap(terms, map = {}, constants = []) {
  terms.forEach(function(term) {
    if (Node.Type.isConstant(term)
        || Node.Type.isConstantFraction(term)) {
      constants.push(term);
    }
    else if (Node.Type.isOperator(term, '^')) {
      const base = print(getContent(term.args[0]));
      const exponentVal = getContent(term.args[1]).value;

      if (!map[base]) {
        map[base] = exponentVal;
      }
      else {
        map[base] = Math.max(exponentVal, map[base]);
      }
    }
    else if (Node.Type.isOperator(term, '*')) {
      exponentMap(term.args, map, constants);
    }
    else {
      const printTerm = print(getContent(term));
      if (!map[printTerm]) {
        map[printTerm] = 1;
      }
    }
  });
  return [map, constants];
}

/*
  Cancels like terms in a fraction node
  e.g. (2x^2 * 5) / 2x^2 => 5 / 1

  Assume only one/ or no constant in numerator and denominator
  Returns a Node.Status object
*/

function cancelLikeTerms(node) {
  if (!Node.Type.isOperator(node, '/')) {
    return Node.Status.noChange(node);
  }

  const numerator = getContent(node.args[0]);
  const denominator = getContent(node.args[1]);

  /*
    Generate the exponentMap and get the constant term for both
    the numerator and denominator
    e.g. (2x) / (4x^2)
    numerator : 2x, numMap : {'x': 1}, numConstant: [2]
    denominator: 4x^2, denomMap: {'x': 2}, denomConstant: [4]
  */
  const [numMap, numConstant] = Node.Type.isOperator(numerator, '*')
        ? exponentMap(numerator.args)
        : exponentMap([numerator]);
  const [denomMap, denomConstant] = Node.Type.isOperator(denominator, '*')
        ? exponentMap(denominator.args)
        : exponentMap([denominator]);

  const newNumeratorTerms = [];
  const newDenomTerms = [];

  /*
    For each term in the numerator, if a term with the same base appears
    in the denominator, cancel the terms and push the new term to either
    the newNumeratorTerms array or newDenomTerms array depending on the
    difference of their exponents.

    e.g. numMap: {'x': 2, 'x + 1': 1, 'x + 2': 4, 'x + 3': 3}
         denomMap: {'x': 1, 'x + 1': 2, 'x + 2': 2}
    newNumeratorTerms: [x, (x + 2)^2, (x + 3)^3]
    newDenomTerms: [x + 1]
   */
  Object.keys(numMap).forEach(function(key){
    const baseNode = math.parse(key);
    let newExponent;
    if (denomMap[key]) {
      const difference = numMap[key] - denomMap[key];
      if (difference === 0) {
      }
      else if (difference === 1) {
        newNumeratorTerms.push(baseNode);
      }
      else if (difference > 1){
        newExponent = Node.Creator.constant(difference);
        newNumeratorTerms.push(Node.Creator.operator('^', [baseNode, newExponent]));
      }
      else if (difference === -1) {
        newDenomTerms.push(baseNode);
      }
      else {
        newExponent = Node.Creator.constant(difference * -1);
        newDenomTerms.push(Node.Creator.operator('^', [baseNode, newExponent]));
      }
    }
    else {
      // The numerator term did not appear in the denominator.
      // Push the term to newNumeratorTerms array.
      numMap[key] === 1
        ? newNumeratorTerms.push(baseNode)
        : newNumeratorTerms.push(Node.Creator.operator('^', [baseNode, math.parse(numMap[key])]));
    }
  });

  Object.keys(denomMap).forEach(function(key) {
    if (!numMap[key]) {
      const baseNode = math.parse(key);
      denomMap[key] === 1
        ? newDenomTerms.push(baseNode)
        : newDenomTerms.push(Node.Creator.operator('^', [baseNode, denomMap[key]]));
    }
  });

  // Add the constant terms to the front of numerator and denominator array.
  // Try to reduce it first if constant appears in both numerator and denominator.
  if (numConstant.length === 0) {
    if (denomConstant.length === 0) {
    }
    else {
      newDenomTerms.unshift(denomConstant[0]);
    }
  }
  else if (denomConstant.length === 0) {
    newNumeratorTerms.unshift(numConstant[0]);
  }
  else {
    const newConstant = Node.Creator.operator('/', [numConstant[0], denomConstant[0]]);

    const simplifiedNode = divideByGCD(newConstant).newNode;
    if (Node.Type.isConstant(simplifiedNode)) {
      newNumeratorTerms.unshift(simplifiedNode);
    }
    else {
      newNumeratorTerms.unshift(simplifiedNode.args[0]);
      newDenomTerms.unshift(simplifiedNode.args[1]);
    }
  }

  const newNumerator = Node.Creator.operator('*', newNumeratorTerms);
  const newDenominator = Node.Creator.operator('*', newDenomTerms);

  let newNode;

  if (newNumeratorTerms.length === 0 && newDenomTerms.length === 0) {
    newNode = Node.Creator.constant(1);
  // All terms in numerator cancelled.
  }
  else if (newNumeratorTerms.length === 0) {
    newNode = Node.Creator.operator('/', [Node.Creator.constant(1), newDenominator]);
  }
  // All terms in denominator cancelled.
  else if (newDenomTerms.length === 0) {
    newNode = newNumerator;
  }
  else {
    newNode = Node.Creator.operator('/', [newNumerator, newDenominator]);
  }

  // Node remained the same, no terms were cancelled.
  if (print(numerator) === print(newNumerator)
      && print(denominator) === print(newDenominator)) {
    return Node.Status.noChange(node);
  }

  return Node.Status.nodeChanged(
    ChangeTypes.CANCEL_TERMS, node, newNode);
}

module.exports = cancelLikeTerms;
