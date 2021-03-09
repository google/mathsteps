import { TreeSearch } from "../../TreeSearch";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { nthRoot } from "./nthRoot";
import { absoluteValue } from "./absoluteValue";

const FUNCTIONS = [nthRoot, absoluteValue];

// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a Status object.
export const functionsSearch = TreeSearch.postOrder(functions);

// Evaluates a function call if possible. Returns a Status object.
function functions(node) {
  if (!NodeType.isFunction(node)) {
    return NodeStatus.noChange(node);
  }

  for (let i = 0; i < FUNCTIONS.length; i++) {
    const nodeStatus = FUNCTIONS[i](node);
    if (nodeStatus.hasChanged) {
      return nodeStatus;
    }
  }
  return NodeStatus.noChange(node);
}
