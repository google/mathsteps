const Node = require('./node');

const TreeSearch = {};

// Returns a function that performs a preorder search on the tree for the given
// simplification function
TreeSearch.preOrder = function(simplificationFunction) {
  return function (node, options={}) {
    return search(simplificationFunction, node, true, options);
  };
};

// Returns a function that performs a postorder search on the tree for the given
// simplification function
TreeSearch.postOrder = function(simplificationFunction) {
  return function (node, options={}) {
    return search(simplificationFunction, node, false, options);
  };
};

// A helper function for performing a tree search with a function
function search(simplificationFunction, node, preOrder, options={}) {
  let status;

  if (preOrder) {
    status = simplificationFunction(node, options);
    if (status.hasChanged()) {
      return status;
    }
  }

  if (Node.Type.isConstant(node)) {
    return Node.Status.noChange(node);
  }
  // Check isUnaryMinus before Symbol because symbols nested inside unaryMinus
  // (e.g., 2x - symbol) need to be subtracted from the expression. Checking
  // symbol first causes the symbol to be added.
  else if (Node.Type.isUnaryMinus(node)) {
    status = search(simplificationFunction, node.args[0], preOrder, options);
    if (status.hasChanged()) {
      return Node.Status.childChanged(node, status);
    }
  }
  // symbols can be simplified through variable substitution
  else if (Node.Type.isSymbol(node)) {
    return simplificationFunction(node, options);
  }
  else if (Node.Type.isOperator(node) || Node.Type.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = search(simplificationFunction, child, preOrder, options);
      if (childNodeStatus.hasChanged()) {
        return  Node.Status.childChanged(node, childNodeStatus, i);
      }
    }
  }
  else if (Node.Type.isParenthesis(node)) {
    status = search(simplificationFunction, node.content, preOrder, options);
    if (status.hasChanged()) {
      return Node.Status.childChanged(node, status);
    }
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }

  if (!preOrder) {
    return simplificationFunction(node, options);
  }
  else {
    return Node.Status.noChange(node);
  }
}


module.exports = TreeSearch;
