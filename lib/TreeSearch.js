const Node = require('./node')

const TreeSearch = {}

// Returns a function that performs a preorder search on the tree for the given
// simplification function
TreeSearch.preOrder = function(simplificationFunction) {
  return function (node, expressionCtx) {
    return search(simplificationFunction, node, true, expressionCtx, null)
  }
}

// Returns a function that performs a postorder search on the tree for the given
// simplification function
TreeSearch.postOrder = function(simplificationFunction) {
  return function (node, expressionCtx) {
    return search(simplificationFunction, node, false, expressionCtx, null)
  }
}

// A helper function for performing a tree search with a function
function search(simplificationFunction, node, preOrder, expressionCtx, parentNode) {
  let status

  if (preOrder) {
    status = simplificationFunction(node, expressionCtx, parentNode)
    if (status.hasChanged()) {
      return status
    }
  }

  if (Node.Type.isConstant(node) || Node.Type.isSymbol(node)) {
    return Node.Status.noChange(node)
  } else if (Node.Type.isUnaryMinus(node)) {
    status = search(simplificationFunction, node.args[0], preOrder, expressionCtx, parentNode)
    if (status.hasChanged()) {
      return Node.Status.childChanged(node, status)
    }
  } else if (Node.Type.isOperator(node) || Node.Type.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i]
      const childNodeStatus = search(simplificationFunction, child, preOrder, expressionCtx, node)
      if (childNodeStatus.hasChanged()) {
        return  Node.Status.childChanged(node, childNodeStatus, i)
      }
    }
  } else if (Node.Type.isParenthesis(node)) {
    status = search(simplificationFunction, node.content, preOrder, expressionCtx, parentNode)
    if (status.hasChanged()) {
      return Node.Status.childChanged(node, status)
    }
  } else {
    throw Error('Unsupported node type: ' + node)
  }

  if (!preOrder) {
    return simplificationFunction(node, expressionCtx, parentNode)
  } else {
    return Node.Status.noChange(node)
  }
}

module.exports = TreeSearch
