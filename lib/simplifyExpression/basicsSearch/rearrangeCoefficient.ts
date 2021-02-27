import { ChangeTypes } from "../../ChangeTypes";
import { NodeStatus } from "../../node/NodeStatus";
import { PolynomialTerm } from "../../node/PolynomialTerm";
import { NodeCreator } from "../../node/Creator";
import { canRearrangeCoefficient } from "../../checks/canRearrangeCoefficient";

// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a Status object
export function rearrangeCoefficient(node) {
  if (!canRearrangeCoefficient(node)) {
    return NodeStatus.noChange(node);
  }

  let newNode = node.cloneDeep();

  const polyNode = new PolynomialTerm(newNode.args[0]);
  const constNode = newNode.args[1];
  const exponentNode = polyNode.getExponentNode();
  newNode = NodeCreator.polynomialTerm(
    polyNode.getSymbolNode(),
    exponentNode,
    constNode
  );

  return NodeStatus.nodeChanged(ChangeTypes.REARRANGE_COEFF, node, newNode);
}
