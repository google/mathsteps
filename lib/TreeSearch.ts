import { NodeStatus } from "./node/NodeStatus";
import { NodeType } from "./node/NodeType";

export function search(simplificationFunction, node, preOrder) {
  let status;

  if (preOrder) {
    status = simplificationFunction(node);
    if (status.hasChanged()) {
      return status;
    }
  }

  if (NodeType.isConstant(node) || NodeType.isSymbol(node)) {
    return NodeStatus.noChange(node);
  } else if (NodeType.isUnaryMinus(node)) {
    status = search(simplificationFunction, node.args[0], preOrder);
    if (status.hasChanged()) {
      return NodeStatus.childChanged(node, status);
    }
  } else if (NodeType.isOperator(node) || NodeType.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = search(simplificationFunction, child, preOrder);
      if (childNodeStatus.hasChanged()) {
        return NodeStatus.childChanged(node, childNodeStatus, i);
      }
    }
  } else if (NodeType.isParenthesis(node)) {
    status = search(simplificationFunction, node.content, preOrder);
    if (status.hasChanged()) {
      return NodeStatus.childChanged(node, status);
    }
  } else {
    throw Error("Unsupported node type: " + node);
  }

  if (!preOrder) {
    return simplificationFunction(node);
  } else {
    return NodeStatus.noChange(node);
  }
}

class TreeSearchImpl {
  /**
   * Returns a function that performs a preorder search on the tree for the given
   * simplification function
   * */
  preOrder(simplificationFunction) {
    return function (node) {
      return search(simplificationFunction, node, true);
    };
  }

  /**
   * Returns a function that performs a postorder search on the tree for the given
   * simplification function
   * */
  postOrder(simplificationFunction) {
    return function (node) {
      return search(simplificationFunction, node, false);
    };
  }
}

export const TreeSearch = new TreeSearchImpl();
