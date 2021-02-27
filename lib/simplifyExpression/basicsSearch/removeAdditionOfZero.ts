import { ChangeTypes } from "../../ChangeTypes";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeType } from "../../node/NodeType";

/**
 * If `node` is an addition node with 0 as one of its operands,
 * remove 0 from the operands list. Returns a Status object.
 * */
export function removeAdditionOfZero(node) {
  if (node.op !== "+") {
    return NodeStatus.noChange(node);
  }
  const zeroIndex = node.args.findIndex((arg) => {
    return NodeType.isConstant(arg) && arg.value === "0";
  });
  let newNode = node.cloneDeep();
  if (zeroIndex >= 0) {
    // remove the 0 node
    newNode.args.splice(zeroIndex, 1);
    // if there's only one operand left, there's nothing left to add it to,
    // so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO,
      node,
      newNode
    );
  }
  return NodeStatus.noChange(node);
}
