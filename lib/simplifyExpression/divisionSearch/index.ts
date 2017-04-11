import ChangeTypes = require("../../ChangeTypes");
import mathNode = require("../../mathnode");
import TreeSearch = require("../../TreeSearch");

// Searches for and simplifies any chains of division or nested division.
// Returns a mathNode.Status object
const search = TreeSearch.preOrder(division);

function division(node: mathjs.MathNode) {
  if (!mathNode.Type.isOperator(node) || node.op !== "/") {
    return mathNode.Status.noChange(node);
  }
  // e.g. 2/(x/6) => 2 * 6/x
  let nodeStatus =  multiplyByInverse(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }
  // e.g. 2/x/6 -> 2/(x*6)
  nodeStatus = simplifyDivisionChain(node);
  if (nodeStatus.hasChanged()) {
    return nodeStatus;
  }
  return mathNode.Status.noChange(node);
}

// If `node` is a fraction with a denominator that is also a fraction, multiply
// by the inverse.
// e.g. x/(2/3) -> x * 3/2

function multiplyByInverse(node: mathjs.MathNode) {
  let denominator = node.args[1];
  if (mathNode.Type.isParenthesis(denominator)) {
    denominator = denominator.content;
  }
  if (!mathNode.Type.isOperator(denominator) || denominator.op !== "/") {
    return mathNode.Status.noChange(node);
  }
  // At this point, we know that node is a fraction and denonimator is the
  // fraction we need to inverse.
  const inverseNumerator = denominator.args[1];
  const inverseDenominator = denominator.args[0];
  const inverseFraction = mathNode.Creator.operator(
    "/", [inverseNumerator, inverseDenominator]);

  const newNode = mathNode.Creator.operator("*", [node.args[0], inverseFraction]);
  return mathNode.Status.nodeChanged(
    ChangeTypes.MULTIPLY_BY_INVERSE, node, newNode);
}

// Simplifies any chains of division into a single division operation.
// e.g. 2/x/6 -> 2/(x*6)
// Returns a mathNode.Status object
function simplifyDivisionChain(node: mathjs.MathNode) {
  // check for a chain of division
  const denominatorList = getDenominatorList(node);
  // one for the numerator, and at least two terms in the denominator
  if (denominatorList.length > 2) {
    const numerator = denominatorList.shift();
    // the new single denominator is all the chained denominators
    // multiplied together, in parentheses.
    const denominator = mathNode.Creator.parenthesis(
      mathNode.Creator.operator("*", denominatorList));
    const newNode = mathNode.Creator.operator("/", [numerator, denominator]);
    return mathNode.Status.nodeChanged(
      ChangeTypes.SIMPLIFY_DIVISION, node, newNode);
  }
  return mathNode.Status.noChange(node);
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

export = search;
