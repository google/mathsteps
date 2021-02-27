import { ChangeTypes } from "../../ChangeTypes";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

/**
 * Simplifies two unary minuses in a row by removing both of them.
 * e.g. -(- 4) --> 4
 * */
export function simplifyDoubleUnaryMinus(node) {
  if (!NodeType.isUnaryMinus(node)) {
    return NodeStatus.noChange(node);
  }
  const unaryArg = node.args[0];

  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (NodeType.isUnaryMinus(unaryArg)) {
    const newNode = unaryArg.args[0].cloneDeep();
    return NodeStatus.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS,
      node,
      newNode
    );
  }

  // e.g. - -4, -4 could be a constant with negative value
  else if (NodeType.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
    const newNode = NodeCreator.constant(parseFloat(unaryArg.value) * -1);
    return NodeStatus.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS,
      node,
      newNode
    );
  }
  // e.g. -(-(5+2))
  else if (NodeType.isParenthesis(unaryArg)) {
    const parenthesisNode = unaryArg;
    const parenthesisContent = parenthesisNode.content;
    if (NodeType.isUnaryMinus(parenthesisContent)) {
      const newNode = NodeCreator.parenthesis(parenthesisContent.args[0]);
      return NodeStatus.nodeChanged(
        ChangeTypes.RESOLVE_DOUBLE_MINUS,
        node,
        newNode
      );
    }
  }
  return NodeStatus.noChange(node);
}
