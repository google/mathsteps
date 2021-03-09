import * as math from "mathjs";

import { flattenOperands } from "../util/flattenOperands";
import { removeUnnecessaryParens } from "../util/removeUnnecessaryParens";
import { stepThrough } from "./stepThrough";
import { hasUnsupportedNodes } from "../checks/hasUnsupportedNodes";
import { printAscii } from "../util/print";

// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
export function simplify(node, debug = false) {
  if (hasUnsupportedNodes(node)) {
    return node;
  }

  const steps = stepThrough(node, debug);
  let simplifiedNode;
  if (steps.length > 0) {
    simplifiedNode = steps.pop().newNode;
  } else {
    // removing parens isn't counted as a step, so try it here
    simplifiedNode = removeUnnecessaryParens(flattenOperands(node), true);
  }
  // unflatten the node.
  return unflatten(simplifiedNode);
}

// Unflattens a node so it is in the math.js style, by printing and parsing it
// again
function unflatten(node) {
  return math.parse(printAscii(node));
}
