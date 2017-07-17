/*
 * Performs simpifications that are more basic and overaching like (...)^0 => 1
 * These are always the first simplifications that are attempted.
 */

const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

const convertMixedNumberToImproperFraction = require('./convertMixedNumberToImproperFraction');
const rearrangeCoefficient = require('./rearrangeCoefficient');
const reduceExponentByZero = require('./reduceExponentByZero');
const reduceMultiplicationByZero = require('./reduceMultiplicationByZero');
const reduceZeroDividedByAnything = require('./reduceZeroDividedByAnything');
const removeAdditionOfZero = require('./removeAdditionOfZero');
const removeDivisionByOne = require('./removeDivisionByOne');
const removeExponentBaseOne = require('./removeExponentBaseOne');
const removeExponentByOne = require('./removeExponentByOne');
const removeMultiplicationByNegativeOne = require('./removeMultiplicationByNegativeOne');
const removeMultiplicationByOne = require('./removeMultiplicationByOne');
const simplifyDoubleUnaryMinus = require('./simplifyDoubleUnaryMinus');

const SIMPLIFICATION_FUNCTIONS = [
  // convert mixed numbers to improper fractions
  convertMixedNumberToImproperFraction,
  // multiplication by 0 yields 0
  reduceMultiplicationByZero,
  // division of 0 by something yields 0
  reduceZeroDividedByAnything,
  // ____^0 --> 1
  reduceExponentByZero,
  // Check for x^1 which should be reduced to x
  removeExponentByOne,
  // Check for 1^x which should be reduced to 1
  // if x can be simplified to a constant
  removeExponentBaseOne,
  // - - becomes +
  simplifyDoubleUnaryMinus,
  // If this is a + node and one of the operands is 0, get rid of the 0
  removeAdditionOfZero,
  // If this is a * node and one of the operands is 1, get rid of the 1
  removeMultiplicationByOne,
  // In some cases, remove multiplying by -1
  removeMultiplicationByNegativeOne,
  // If this is a / node and the denominator is 1 or -1, get rid of it
  removeDivisionByOne,
  // e.g. x*5 -> 5x
  rearrangeCoefficient,
];

const search = TreeSearch.preOrder(basics);

// Look for basic step(s) to perform on a node. Returns a Node.Status object.
function basics(node) {
  for (let i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
    const nodeStatus = SIMPLIFICATION_FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    else {
      node = nodeStatus.newNode;
    }
  }
  return Node.Status.noChange(node);
}

module.exports = search;
