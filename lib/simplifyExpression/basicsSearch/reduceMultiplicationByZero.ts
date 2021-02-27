import { ChangeTypes } from "../../ChangeTypes";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { PolynomialTerm } from "../../node/PolynomialTerm";
import { NodeCreator } from "../../node/Creator";

// If `node` is a multiplication node with 0 as one of its operands,
// reduce the node to 0. Returns a Status object.
export function reduceMultiplicationByZero(node) {
  if (node.op !== "*") {
    return NodeStatus.noChange(node);
  }
  const zeroIndex = node.args.findIndex((arg) => {
    if (NodeType.isConstant(arg) && arg.value === "0") {
      return true;
    }
    if (PolynomialTerm.isPolynomialTerm(arg)) {
      const polyTerm = new PolynomialTerm(arg);
      return polyTerm.getCoeffValue() === 0;
    }
    return false;
  });
  if (zeroIndex >= 0) {
    // reduce to just the 0 node
    const newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
  } else {
    return NodeStatus.noChange(node);
  }
}
