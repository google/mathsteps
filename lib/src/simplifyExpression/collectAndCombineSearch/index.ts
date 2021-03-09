// Collects and combines like terms

import { ChangeTypes } from "../../ChangeTypes";
import { LikeTermCollector } from "./LikeTermCollector";
import { TreeSearch } from "../../TreeSearch";
import { addLikeTerms } from "./addLikeTerms";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeType } from "../../node/NodeType";
import { canMultiplyLikeTermConstantNodes } from "../../checks/canMultiplyLikeTermConstantNodes";
import { multiplyLikeTerms } from "./multiplyLikeTerms";

const termCollectorFunctions = {
  "+": addLikeTerms,
  "*": multiplyLikeTerms,
};

// Iterates through the tree looking for like terms to collect and combine.
// Will prioritize deeper expressions. Returns a Status object.
export const collectAndCombineSearch = TreeSearch.postOrder(
  collectAndCombineLikeTerms
);

// Given an operator node, maybe collects and then combines if possible
// e.g. 2x + 4x + y => 6x + y
// e.g. 2x * x^2 * 5x => 10 x^4
function collectAndCombineLikeTerms(node) {
  if (node.op === "+") {
    const status = collectAndCombineOperation(node);
    if (status.hasChanged) {
      return status;
    }
    // we might also be able to just combine if they're all the same term
    // e.g. 2x + 4x + x (doesn't need collecting)
    return addLikeTerms(node, true);
  } else if (node.op === "*") {
    // collect and combine involves there being coefficients pulled the front
    // e.g. 2x * x^2 * 5x => (2*5) * (x * x^2 * x) => ... => 10 x^4
    if (canMultiplyLikeTermConstantNodes(node)) {
      return multiplyLikeTerms(node, true);
    }
    const status = collectAndCombineOperation(node);
    if (status.hasChanged) {
      // make sure there's no * between the coefficient and the symbol part
      status.newNode.implicit = true;
      return status;
    }
    // we might also be able to just combine polynomial terms
    // e.g. x * x^2 * x => ... => x^4
    return multiplyLikeTerms(node, true);
  } else {
    return NodeStatus.noChange(node);
  }
}

// Collects and combines (if possible) the arguments of an addition or
// multiplication
function collectAndCombineOperation(node) {
  let substeps = [];

  const status = LikeTermCollector.collectLikeTerms(node.cloneDeep());
  if (!status.hasChanged) {
    return status;
  }

  // STEP 1: collect like terms, e.g. 2x + 4x^2 + 5x => 4x^2 + (2x + 5x)
  substeps.push(status);
  let newNode = NodeStatus.resetChangeGroups(status.newNode);

  // STEP 2 onwards: combine like terms for each group that can be combined
  // e.g. (x + 3x) + (2 + 2) has two groups
  const combineSteps = combineLikeTerms(newNode);
  if (combineSteps.length > 0) {
    substeps = substeps.concat(combineSteps);
    const lastStep = combineSteps[combineSteps.length - 1];
    newNode = NodeStatus.resetChangeGroups(lastStep.newNode);
  }

  return NodeStatus.nodeChanged(
    ChangeTypes.COLLECT_AND_COMBINE_LIKE_TERMS,
    node,
    newNode,
    true,
    substeps
  );
}

// step 2 onwards for collectAndCombineOperation
// combine like terms for each group that can be combined
// e.g. (x + 3x) + (2 + 2) has two groups
// returns a list of combine steps
function combineLikeTerms(node) {
  const steps = [];
  let newNode = node.cloneDeep();

  for (let i = 0; i < node.args.length; i++) {
    let child = node.args[i];
    // All groups of terms will be surrounded by parenthesis
    if (!NodeType.isParenthesis(child)) {
      continue;
    }
    child = child.content;
    const childStatus = termCollectorFunctions[newNode.op](child);
    if (childStatus.hasChanged) {
      const status = NodeStatus.childChanged(newNode, childStatus, i);
      steps.push(status);
      newNode = NodeStatus.resetChangeGroups(status.newNode);
    }
  }

  return steps;
}
