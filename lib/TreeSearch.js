import {query} from 'math-nodes';
import {Status} from './Status.js';
import {canApplyRule, applyRule} from 'math-rules';
import {rules} from 'math-rules';

const TreeSearch = {};

// Returns a function that performs a preorder search on the tree for the given
// simplifcation function
TreeSearch.preOrder = function(simplificationFunction) {
  return function (node) {
    return search(simplificationFunction, node, true);
  };
};

// Returns a function that performs a postorder search on the tree for the given
// simplifcation function
TreeSearch.postOrder = function(simplificationFunction) {
  return function (node) {
    return search(simplificationFunction, node, false);
  };
};

// A helper function for performing a tree search with a function
function search(simplificationFunction, node, preOrder) {
  let status;

  if (preOrder) {
    status = simplificationFunction(node);
    if (status.hasChanged()) {
      return status;
    }
  }

  if (query.isNumber(node) || query.isIdentifier(node)) {
    return Status.noChange(node);
  }
  else if (query.isNeg(node)) {
    status = search(simplificationFunction, node.
                    args[0], preOrder);
    if (status) {
      return Status.childChanged(node, status);
    }
  }
  else if (query.isOperation(node) || query.isFunction(node)) {
    for (let i = 0; i < node.args.length; i++) {
      const child = node.args[i];
      const childNodeStatus = search(simplificationFunction, child, preOrder);
      if (childNodeStatus.hasChanged()) {
        return  Status.childChanged(node, childNodeStatus, i);
      }
    }
  }
  else if (query.isParenthesis(node)) {
    status = search(simplificationFunction, node.content, preOrder);
    if (status) {
      return Status.childChanged(node, status);
    }
  }
  else {
    throw Error('Unsupported node type: ' + node);
  }

  if (!preOrder) {
    return simplificationFunction(node);
  }
  else {
    return Status.noChange(node);
  }
}



module.exports = TreeSearch;
