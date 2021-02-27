import { ChangeTypes } from "../../ChangeTypes";
import { Negative } from "../../Negative";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeType } from "../../node/NodeType";
import { NodeCreator } from "../../node/Creator";

/**
 * If `node` is a division operation of something by 1 or -1, we can remove the
 * denominator. Returns a Status object.
 * */
export function removeDivisionByOne(node) {
  if (node.op !== "/") {
    return NodeStatus.noChange(node);
  }
  const denominator = node.args[1];
  if (!NodeType.isConstant(denominator)) {
    return NodeStatus.noChange(node);
  }
  // It's taken 40ms on average to pass distribution test,
  // TODO: see if we should keep using utils/clone here
  let numerator = node.args[0].cloneDeep();

  // if denominator is -1, we make the numerator negative
  if (parseFloat(denominator.value) === -1) {
    // If the numerator was an operation, wrap it in parens before adding -
    // to the front.
    // e.g. 2+3 / -1 ---> -(2+3)
    if (NodeType.isOperator(numerator)) {
      numerator = NodeCreator.parenthesis(numerator);
    }
    const changeType = Negative.isNegative(numerator)
      ? ChangeTypes.RESOLVE_DOUBLE_MINUS
      : ChangeTypes.DIVISION_BY_NEGATIVE_ONE;
    numerator = Negative.negate(numerator);
    return NodeStatus.nodeChanged(changeType, node, numerator);
  } else if (parseFloat(denominator.value) === 1) {
    return NodeStatus.nodeChanged(ChangeTypes.DIVISION_BY_ONE, node, numerator);
  } else {
    return NodeStatus.noChange(node);
  }
}
