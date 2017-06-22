const evaluate = require('math-evaluator').default;

// Evaluates a node to a numerical value
// e.g. the tree representing (2 + 2) * 5 would be evaluated to the number 20
// it's important that `node` does not contain any symbol nodes

function evaluates(node) {
  return evaluate(node);
}

module.exports = evaluates; 
