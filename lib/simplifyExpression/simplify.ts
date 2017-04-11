import math = require("mathjs");
import checks = require("../checks");
import flattenOperands = require("../util/flattenOperands");
import print = require("../util/print");
import removeUnnecessaryParens = require("../util/removeUnnecessaryParens");
import stepThrough = require("./stepThrough");


// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
function simplify(node: mathjs.MathNode, debug=false) {
  if (checks.hasUnsupportedNodes(node)) {
    return node;
  }

  const steps = stepThrough(node, debug);
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
function unflatten(node: mathjs.MathNode) {
  return math.parse(print(node));
}

export = simplify;
