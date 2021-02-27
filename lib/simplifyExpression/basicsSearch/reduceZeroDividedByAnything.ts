import { ChangeTypes } from "../../ChangeTypes";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a Status object.
export function reduceZeroDividedByAnything(node) {
  if (node.op !== "/") {
    return NodeStatus.noChange(node);
  }
  if (node.args[0].value === "0") {
    const newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR,
      node,
      newNode
    );
  } else {
    return NodeStatus.noChange(node);
  }
}
