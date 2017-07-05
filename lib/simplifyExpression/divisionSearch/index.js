const ChangeTypes = require('../../ChangeTypes');
const clone = require('../../util/clone');
const evaluate = require('math-evaluator').default;
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

const {build, query} = require('math-nodes');
const {defineRule, rewriteNode, definePatternRule} = require('math-rules');
const {parse} = require('math-parser');
const {traverse} = require('math-traverse');

// Searches for and simplifies any chains of division or nested division.
// Returns a Node.Status object
const search = TreeSearch.preOrder(division);

const defineRuleString = (matchPattern, rewritePattern, constraints) => {
  const matchAST = parse(matchPattern);
  const rewriteAST = parse(rewritePattern);

  traverse(matchAST, {
    leave(node) {
      delete node.loc;
    }
  });

  traverse(rewriteAST, {
    leave(node) {
      delete node.loc;
    }
  });

  return definePatternRule(matchAST, rewriteAST, constraints);
}

function apply(node, rule, changeType) {
  let newNode = rewriteNode(rule, node);

  if (newNode) {
    return Node.Status.nodeChanged(
      changeType, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

function division(node) {
  let status = apply(node, SIMPLIFY_DIVISION, ChangeTypes.SIMPLIFY_DIVISION);

  if (!status.hasChanged()) {
    status = apply(node, MULTIPLY_BY_INVERSE, ChangeTypes.MULTIPLY_BY_INVERSE);
  }

  return status;
}

// e.g. 2/3/4 -> 2/(3*4)
const SIMPLIFY_DIVISION = defineRuleString('#a / #b / #c', '#a / (#b * #c)');

// e.g. x/(2/3) -> x * 3/2
const MULTIPLY_BY_INVERSE = defineRuleString('#a / (#b / #c)', '#a * (#c / #b)');


module.exports = search;
