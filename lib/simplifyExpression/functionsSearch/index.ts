import absoluteValue = require('./absoluteValue');
import nthRoot = require('./nthRoot');
const mathNode = require('../../node');
import TreeSearch = require('../../TreeSearch');
const FUNCTIONS = [
  nthRoot,
  absoluteValue
];

// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a mathNode.Status object.
const search = TreeSearch.postOrder(functions);

// Evaluates a function call if possible. Returns a mathNode.Status object.
function functions(node: any);
function functions(node) {
  if (!mathNode.Type.isFunction(node)) {
    return mathNode.Status.noChange(node);
  }

  for (let i = 0; i < FUNCTIONS.length; i++) {
    const nodeStatus = FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
  }
  return mathNode.Status.noChange(node);
}

export = search;
