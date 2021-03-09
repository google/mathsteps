import { ChangeTypes } from "../../ChangeTypes";
import { TreeSearch } from "../../TreeSearch";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Searches for and simplifies any chains of division or nested division.
// Returns a Status object
export const divisionSearch = TreeSearch.preOrder(division);

function division(node) {
  if (!NodeType.isOperator(node) || node.op !== "/") {
    return NodeStatus.noChange(node);
  }
  // e.g. 2/(x/6) => 2 * 6/x
  let nodeStatus = multiplyByInverse(node);
  if (nodeStatus.hasChanged) {
    return nodeStatus;
  }
  // e.g. 2/x/6 -> 2/(x*6)
  nodeStatus = simplifyDivisionChain(node);
  if (nodeStatus.hasChanged) {
    return nodeStatus;
  }
  return NodeStatus.noChange(node);
}

// If `node` is a fraction with a denominator that is also a fraction, multiply
// by the inverse.
// e.g. x/(2/3) -> x * 3/2
function multiplyByInverse(node) {
  let denominator = node.args[1];
  if (NodeType.isParenthesis(denominator)) {
    denominator = denominator.content;
  }
  if (!NodeType.isOperator(denominator) || denominator.op !== "/") {
    return NodeStatus.noChange(node);
  }
  // At this point, we know that node is a fraction and denonimator is the
  // fraction we need to inverse.
  const inverseNumerator = denominator.args[1];
  const inverseDenominator = denominator.args[0];
  const inverseFraction = NodeCreator.operator("/", [
    inverseNumerator,
    inverseDenominator,
  ]);

  const newNode = NodeCreator.operator("*", [node.args[0], inverseFraction]);
  return NodeStatus.nodeChanged(ChangeTypes.MULTIPLY_BY_INVERSE, node, newNode);
}

// Simplifies any chains of division into a single division operation.
// e.g. 2/x/6 -> 2/(x*6)
// Returns a Status object
function simplifyDivisionChain(node) {
  // check for a chain of division
  const denominatorList = getDenominatorList(node);
  // one for the numerator, and at least two terms in the denominator
  if (denominatorList.length > 2) {
    const numerator = denominatorList.shift();
    // the new single denominator is all the chained denominators
    // multiplied together, in parentheses.
    const denominator = NodeCreator.parenthesis(
      NodeCreator.operator("*", denominatorList)
    );
    const newNode = NodeCreator.operator("/", [numerator, denominator]);
    return NodeStatus.nodeChanged(ChangeTypes.SIMPLIFY_DIVISION, node, newNode);
  }
  return NodeStatus.noChange(node);
}

// Given a the denominator of a division node, returns all the nested
// denominator nodess. e.g. 2/3/4/5 would return [2,3,4,5]
// (note: all the numbers in the example are actually constant nodes)
function getDenominatorList(denominator) {
  let node = denominator;
  const denominatorList = [];
  while (node.op === "/") {
    // unshift the denominator to the front of the list, and recurse on
    // the numerator
    denominatorList.unshift(node.args[1]);
    node = node.args[0];
  }
  // unshift the final node, which wasn't a / node
  denominatorList.unshift(node);
  return denominatorList;
}
