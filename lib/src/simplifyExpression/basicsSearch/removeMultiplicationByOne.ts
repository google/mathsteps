import { ChangeTypes } from "../../ChangeTypes";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeType } from "../../node/NodeType";

/**
 * If `node` is a multiplication node with 1 as one of its operands,
 * remove 1 from the operands list. Returns a Status object.
 * */
export function removeMultiplicationByOne(node) {
  if (node.op !== "*") {
    return NodeStatus.noChange(node);
  }
  const oneIndex = node.args.findIndex((arg) => {
    return NodeType.isConstant(arg) && arg.value === "1";
  });
  if (oneIndex >= 0) {
    let newNode = node.cloneDeep();
    // remove the 1 node
    newNode.args.splice(oneIndex, 1);
    // if there's only one operand left, there's nothing left to multiply it
    // to, so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return NodeStatus.nodeChanged(
      ChangeTypes.REMOVE_MULTIPLYING_BY_ONE,
      node,
      newNode
    );
  }
  return NodeStatus.noChange(node);
}
