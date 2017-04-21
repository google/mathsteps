function search(simplificationFunction: function, node: mathjs.MathNode, preOrder: bool) {
  let status;

  if (preOrder) {
    status = simplificationFunction(node);
    if (status.hasChanged()) {
      return status;
    }
  }

  if (node.isConstantNode || node.isSymbolNode) {
    return Node.Status.noChange(node);
  }
  else if (Node.Type.isUnaryMinus(node)) {
    status = search(simplificationFunction, node.args[0], preOrder);
    if (status.hasChanged()) {
      return Node.Status.childChanged(node, status);
    }
  }
  else if (node.isOperatorNode || Node.Type.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = search(simplificationFunction, child, preOrder);
      if (childNodeStatus.hasChanged()) {
        return  Node.Status.childChanged(node, childNodeStatus, i);
      }
    }
  }
  else if (Node.Type.isParenthesis(node)) {
    status = search(simplificationFunction, node.content, preOrder);
    if (status.hasChanged()) {
      return Node.Status.childChanged(node, status);
    }
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }

  if (!preOrder) {
    return simplificationFunction(node);
  }
  else {
    return Node.Status.noChange(node);
  }
}