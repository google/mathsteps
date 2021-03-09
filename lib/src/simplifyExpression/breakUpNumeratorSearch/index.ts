import { ChangeTypes } from "../../ChangeTypes";
import { TreeSearch } from "../../TreeSearch";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a tree search of its own.
// Returns a Status object
export const breakUpNumeratorSearch = TreeSearch.postOrder(breakUpNumerator);

// If `node` is a fraction with a numerator that is a sum, breaks up the
// fraction e.g. (2+x)/5 -> (2/5 + x/5)
// Returns a Status object
function breakUpNumerator(node) {
  if (!NodeType.isOperator(node) || node.op !== "/") {
    return NodeStatus.noChange(node);
  }
  let numerator = node.args[0];
  if (NodeType.isParenthesis(numerator)) {
    numerator = numerator.content;
  }
  if (!NodeType.isOperator(numerator) || numerator.op !== "+") {
    return NodeStatus.noChange(node);
  }

  // At this point, we know that node is a fraction and its numerator is a sum
  // of terms that can't be collected or combined, so we should break it up.
  const fractionList = [];
  const denominator = node.args[1];
  numerator.args.forEach((arg) => {
    const newFraction = NodeCreator.operator("/", [arg, denominator]);
    newFraction.changeGroup = 1;
    fractionList.push(newFraction);
  });

  let newNode = NodeCreator.operator("+", fractionList);
  // Wrap in parens for cases like 2*(2+3)/5 => 2*(2/5 + 3/5)
  newNode = NodeCreator.parenthesis(newNode);
  node.changeGroup = 1;
  return NodeStatus.nodeChanged(
    ChangeTypes.BREAK_UP_FRACTION,
    node,
    newNode,
    false
  );
}
