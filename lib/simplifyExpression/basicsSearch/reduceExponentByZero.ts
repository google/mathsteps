import { ChangeTypes } from "../../ChangeTypes";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeType } from "../../node/NodeType";
import { NodeCreator } from "../../node/Creator";

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a Status object.
export function reduceExponentByZero(node) {
  if (node.op !== "^") {
    return NodeStatus.noChange(node);
  }
  const exponent = node.args[1];
  if (NodeType.isConstant(exponent) && exponent.value === "0") {
    const newNode = NodeCreator.constant(1);
    return NodeStatus.nodeChanged(
      ChangeTypes.REDUCE_EXPONENT_BY_ZERO,
      node,
      newNode
    );
  } else {
    return NodeStatus.noChange(node);
  }
}
