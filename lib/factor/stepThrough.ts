import { factorQuadratic } from "./factorQuadratic";

import { flattenOperands } from "../util/flattenOperands";
import { removeUnnecessaryParens } from "../util/removeUnnecessaryParens";
import { printAscii } from "../util/print";
import { hasUnsupportedNodes } from "../checks/hasUnsupportedNodes";
import { isQuadratic } from "../checks/isQuadratic";

/**
 * Given a mathjs expression node, steps through factoring the expression.
 * Currently only supports factoring quadratics.
 * Returns a list of details about each step.
 * */
export function stepThrough(node, debug = false) {
  if (debug) {
    console.log("\n\nFactoring: " + printAscii(node, false));
  }

  if (hasUnsupportedNodes(node)) {
    return [];
  }

  const steps = [];

  node = flattenOperands(node);
  node = removeUnnecessaryParens(node, true);
  if (isQuadratic(node)) {
    const nodeStatus = factorQuadratic(node);
    if (nodeStatus.hasChanged) {
      steps.push(nodeStatus);
    }
  }
  // Add factoring higher order polynomials...

  return steps;
}
