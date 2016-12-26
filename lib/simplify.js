'use strict';

const math = require('mathjs');

const simplifyExpressionNode = require('./simplifyExpressionNode');
const print = require('./util/print');
const flattenOperands = require('./util/flattenOperands');
const hasUnsupportedNodes = require('./hasUnsupportedNodes');
const removeUnnecessaryParens = require('./util/removeUnnecessaryParens');


// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
function simplify(node, debug=false) {
  if(hasUnsupportedNodes(node)) {
    return node;
  }

  const steps = simplifyExpressionNode(node, debug);
  let simplifiedNode;
  if (steps.length > 0) {
    simplifiedNode = steps.pop().newNode;
  }
  else {
    // removing parens isn't counted as a step, so try it here
    simplifiedNode = removeUnnecessaryParens(flattenOperands(node), true);
  }
  // unflatten the node.
  return unflatten(simplifiedNode);
}

// Unflattens a node so it is in the math.js style, by printing and parsing it
// again
function unflatten(node) {
  return math.parse(print(node));
}


module.exports = simplify;
