const clone = require('../../util/clone');
const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

const {parse} = require('math-parser');
const {build, query} = require('math-nodes');
const {defineRule, rewriteNode} = require('math-rules');
const evaluate = require('math-evaluator').default;

const getRanges = (args, predicate) => {
  const ranges = [];
  let i;
  let start = -1;
  for (i = 0; i < args.length; i++) {
    if (predicate(args[i])) {
      if (start === -1) {
        start = i;
      }
    } else {
      if (start !== -1 && i - start > 1) {
        ranges.push([start, i]);
      }
      start = -1;
    }
  }
  if (start !== -1 && i - start > 1) {
    ranges.push([start, i]);
  }
  return ranges;
}

function applyRule(node, rule, changeType, reverse) {
  let newNode = rewriteNode(rule, node);
  if (!newNode) {
    newNode = rewriteNode(reverse, node);
  }
  if (newNode) {
    return Node.Status.nodeChanged(
      changeType, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// ARITHMETIC

// e.g. 2 + 2 -> 4 or 2 * 2 -> 4
// TODO(kevinb): handle fractions
const SIMPLIFY_ARITHMETIC = defineRule(
  node => {
    if (query.isOperation(node)) {
      if (query.isAdd(node) || query.isMul(node)) {
        if (node.args.every(query.isNumber)) {
          return {node};
        } else {
          const ranges = getRanges(node.args, query.isNumber);
          if (ranges.length > 0) {
            // For now we're only using the first range, but we'll
            // want to use all ranges when we're applying a rule
            // multiple times in the future.
            const indexes = {
              start: ranges[0][0],
              end: ranges[0][1],
            }
            return {node, indexes};
          }
        }
      }
      else if (node.args.every(query.isNumber)) {
        return {node};
      }
    }
    return null;
  },
  // TODO: replace this with '#eval(#a)'
  (node, _, indexes) => {
    const copy = clone(node);
    if (indexes) {
      copy.args = copy.args.slice(indexes.start, indexes.end);
    }
    return parse(String(evaluate(copy)));
  }
)

const isIntegerFraction = (node) =>
      query.isNeg(node)
  ? isIntegerFraction(node.args[0])
  : query.isDiv(node) && node.args.every(arg => Number.isInteger(query.getValue(arg)));

// Searches through the tree, prioritizing deeper nodes, and evaluates
// arithmetic (e.g. 2+2 or 3*5*2) on an operation node if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(arithmetic);

// evaluates arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
// Returns a Node.Status object.
function arithmetic(node) {

  // Only resolve division of integers if we get an integer result.
  // Note that a fraction of decimals will be divided out.
  if (isIntegerFraction(node)) {
    const numeratorValue = parseInt(node.args[0]);
    const denominatorValue = parseInt(node.args[1]);
    if (numeratorValue % denominatorValue === 0) {
      const newNode = build.number(numeratorValue/denominatorValue);
      return Node.Status.nodeChanged(
        ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode);
    }
    else {
      return Node.Status.noChange(node);
    }
  }
  return applyRule(node, SIMPLIFY_ARITHMETIC, ChangeTypes.SIMPLIFY_ARITHMETIC);
}

module.exports = search;
