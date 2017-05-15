import {parse, print} from 'math-parser';
import {removeUnnecessaryParens} from 'math-rules';
import stepThrough from './stepThrough.js';

//const flattenOperands = require('../util/flattenOperands');

// Given a math-parser expression node, steps through simplifying the expression.
// Returns the simplified expression node.
export default function simplify(node, debug=false) {
  /*
  if (checks.hasUnsupportedNodes(node)) {
    return node;
  }
  */

  const steps = stepThrough(node, debug);
  let simplifiedNode;
  if (steps.length > 0) {
    simplifiedNode = steps.pop().newNode;
  }
  else {
    // removing parens isn't counted as a step, so try it here
    simplifiedNode = removeUnnecessaryParens(node);
  }
  // unflatten the node.
  return unflatten(simplifiedNode);
}

// Unflattens a node so it is in the math.js style, by printing and parsing it
// again
function unflatten(node) {
  return parse(print(node));
}


