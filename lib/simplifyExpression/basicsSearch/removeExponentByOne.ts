import { ChangeTypes } from "../../ChangeTypes";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";

// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a Status object.
export function removeExponentByOne(node) {
  if (
    node.op === "^" && // exponent of anything
    NodeType.isConstant(node.args[1]) && // to a constant
    node.args[1].value === "1"
  ) {
    // of value 1
    const newNode = node.args[0].cloneDeep();
    return NodeStatus.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BY_ONE,
      node,
      newNode
    );
  }
  return NodeStatus.noChange(node);
}
