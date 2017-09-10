const checks = require('../checks');
const flattenOperands = require('../util/flattenOperands');
const removeUnnecessaryParens = require('../util/removeUnnecessaryParens');
const stepThrough = require('./stepThrough');


// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
function simplify(node, debug=false) {
  if (checks.hasUnsupportedNodes(node)) {
    return node;
  }

  const steps = stepThrough(node, debug);
  if (steps.length > 0) {
    return steps.pop().newNode;
  }
  else {
    // removing parens isn't counted as a step, so try it here
    return removeUnnecessaryParens(flattenOperands(node), true);
  }
}

module.exports = simplify;
