const mathEvaluator = require('math-evaluator')
// TODO(porting) just require this where it's used in the code

// Evaluates a node to a numerical value
// e.g. the tree representing (2 + 2) * 5 would be evaluated to the number 20
// it's important that `node` does not contain any symbol nodes
function evaluate(node) {
  return mathEvaluator.default(node)
}

module.exports = evaluate
