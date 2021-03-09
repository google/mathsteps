import { resolvesToConstant } from "./resolvesToConstant";
import { NodeType } from "../node/NodeType";

export function hasUnsupportedNodes(node) {
  if (NodeType.isParenthesis(node)) {
    return hasUnsupportedNodes(node.content);
  } else if (NodeType.isUnaryMinus(node)) {
    return hasUnsupportedNodes(node.args[0]);
  } else if (NodeType.isOperator(node)) {
    return node.args.some(hasUnsupportedNodes);
  } else if (NodeType.isSymbol(node) || NodeType.isConstant(node)) {
    return false;
  } else if (NodeType.isFunction(node, "abs")) {
    if (node.args.length !== 1) {
      return true;
    }
    if (node.args.some(hasUnsupportedNodes)) {
      return true;
    }
    return !resolvesToConstant(node.args[0]);
  } else if (NodeType.isFunction(node, "nthRoot")) {
    return node.args.some(hasUnsupportedNodes) || node.args.length < 1;
  } else {
    return true;
  }
}
