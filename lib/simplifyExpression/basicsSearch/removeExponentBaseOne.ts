import { ChangeTypes } from "../../ChangeTypes";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { resolvesToConstant } from "../../checks/resolvesToConstant";

/**
 * If `node` is of the form 1^x, reduces it to a node of the form 1.
 * Returns a Status object.
 * */
export function removeExponentBaseOne(node) {
  if (
    node.op === "^" && // an exponent with
    resolvesToConstant(node.args[1]) && // a power not a symbol and
    NodeType.isConstant(node.args[0]) && // a constant base
    node.args[0].value === "1"
  ) {
    // of value 1
    const newNode = node.args[0].cloneDeep();
    return NodeStatus.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BASE_ONE,
      node,
      newNode
    );
  }
  return NodeStatus.noChange(node);
}
