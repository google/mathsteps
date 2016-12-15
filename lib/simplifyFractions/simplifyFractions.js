'use strict';

/*
 * Performs simpifications on fractions: adding and cancelling out.
 */

const cancelLikeTerms = require('./cancelLikeTerms');
const ConstantFraction = require('../ConstantFraction');
const simplifyFractionSigns = require('./simplifyFractionSigns');
const simplifyPolynomialFraction = require('./simplifyPolynomialFraction');
const NodeStatus = require('../NodeStatus');
const PolynomialTermOperations = require('../PolynomialTermOperations');
const TreeSearch = require('../TreeSearch');

const SIMPLIFICATION_FUNCTIONS = [
  // e.g. 2/3 + 5/6
  ConstantFraction.addConstantFractions,
  // e.g. 4 + 5/6 or 4.5 + 6/8
  ConstantFraction.addConstantAndFraction,
  // e.g. 2/-9  ->  -2/9      e.g. -2/-9  ->  2/9
  simplifyFractionSigns,
  // e.g. 8/12  ->  2/3 (divide by GCD 4)
  ConstantFraction.divideByGCD,
  // e.g. 2x/4 -> x/2 (divideByGCD but for coefficients of polynomial terms)
  simplifyPolynomialFraction,
  // e.g. (2x * 5) / 2x  ->  5
  cancelLikeTerms,
];

const simplifyFractionsTreeSearch = TreeSearch.preOrder(simplifyFractions);

// Look for step(s) to perform on a node. Returns a NodeStatus object.
function simplifyFractions(node) {
  for (let i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
    let nodeStatus = SIMPLIFICATION_FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    else {
      node = nodeStatus.newNode;
    }
  }
  return NodeStatus.noChange(node);
}


module.exports = simplifyFractionsTreeSearch;
