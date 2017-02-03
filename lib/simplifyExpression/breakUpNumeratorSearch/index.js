const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a tree search of its own.
// Returns a Node.Status object
const search = TreeSearch.postOrder(breakUpNumerator);

// If `node` is a fraction with a numerator that is a sum, breaks up the
// fraction e.g. (2+x)/5 -> (2/5 + x/5)
// Returns a Node.Status object
function breakUpNumerator(node) {
  if (!Node.Type.isOperator(node) || node.op !== '/') {
    return Node.Status.noChange(node);
  }
  let numerator = node.args[0];
  if (Node.Type.isParenthesis(numerator)) {
    numerator = numerator.content;
  }
  if (!Node.Type.isOperator(numerator) || numerator.op !== '+') {
    return Node.Status.noChange(node);
  }

  // At this point, we know that node is a fraction and its numerator is a sum
  // of terms that can't be collected or combined, so we should break it up.
  const fractionList = [];
  const denominator = node.args[1];
  numerator.args.forEach(arg => {
    const newFraction = Node.Creator.operator('/', [arg, denominator]);
    newFraction.changeGroup = 1;
    fractionList.push(newFraction);
  });

  let newNode = Node.Creator.operator('+', fractionList);
  // Wrap in parens for cases like 2*(2+3)/5 => 2*(2/5 + 3/5)
  newNode = Node.Creator.parenthesis(newNode);
  node.changeGroup = 1;
  return Node.Status.nodeChanged(
    ChangeTypes.BREAK_UP_FRACTION, node, newNode, false);
}

module.exports = search;
