import * as math from "mathjs";

import { ChangeTypes } from "../../ChangeTypes";
import { evaluate } from "../../util/evaluate";
import { NodeType } from "../../node/NodeType";
import { NodeCreator } from "../../node/Creator";
import { NodeStatus } from "../../node/NodeStatus";

// Evaluates abs() function if it's on a single constant value.
// Returns a Status object.
export function absoluteValue(node) {
  if (!NodeType.isFunction(node, "abs")) {
    return NodeStatus.noChange(node);
  }
  if (node.args.length > 1) {
    return NodeStatus.noChange(node);
  }
  let newNode = node.cloneDeep();
  const argument = newNode.args[0];
  if (NodeType.isConstant(argument, true)) {
    newNode = NodeCreator.constant(math.abs(evaluate(argument)));
    return NodeStatus.nodeChanged(ChangeTypes.ABSOLUTE_VALUE, node, newNode);
  } else if (NodeType.isConstantFraction(argument, true)) {
    const newNumerator = NodeCreator.constant(
      math.abs(evaluate(argument.args[0]))
    );
    const newDenominator = NodeCreator.constant(
      math.abs(evaluate(argument.args[1]))
    );
    newNode = NodeCreator.operator("/", [newNumerator, newDenominator]);
    return NodeStatus.nodeChanged(ChangeTypes.ABSOLUTE_VALUE, node, newNode);
  } else {
    return NodeStatus.noChange(node);
  }
}
