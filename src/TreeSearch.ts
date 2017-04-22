import * as nodeHelper from "./nodeHelper";
class TreeSearch {
    
// Returns a function that performs a preorder search on the tree for the given
// simplifcation function
static preOrder(simplificationFunction) {
  return function (node: mNode) {
    return TreeSearch.search(simplificationFunction, node, true);
  };
};

// Returns a function that performs a postorder search on the tree for the given
// simplifcation function
static postOrder = function(simplificationFunction) {
  return function (node: mNode) {
    return TreeSearch.search(simplificationFunction, node, false);
  };
};

// A helper function for performing a tree search with a function
static search(simplificationFunction, node: mNode, preOrder: boolean) {
  let status;

  if (preOrder) {
    status = simplificationFunction(node);
    if (status.hasChanged()) {
      return status;
    }
  }

  if (nodeHelper.Type.isConstant(node) || nodeHelper.Type.isSymbol(node)) {
    return nodeHelper.Status.noChange(node);
  }
  else if (nodeHelper.Type.isUnaryMinus(node)) {
    status = TreeSearch.search(simplificationFunction, node.args[0], preOrder);
    if (status.hasChanged()) {
      return nodeHelper.Status.childChanged(node, status);
    }
  }
  else if (nodeHelper.Type.isOperator(node) || nodeHelper.Type.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = TreeSearch.search(simplificationFunction, child, preOrder);
      if (childNodeStatus.hasChanged()) {
        return  nodeHelper.Status.childChanged(node, childNodeStatus, i);
      }
    }
  }
  else if (nodeHelper.Type.isParenthesis(node)) {
    status = TreeSearch.search(simplificationFunction, node.content, preOrder);
    if (status.hasChanged()) {
      return nodeHelper.Status.childChanged(node, status);
    }
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }

  if (!preOrder) {
    return simplificationFunction(node);
  }
  else {
    return nodeHelper.Status.noChange(node);
  }
}
}
