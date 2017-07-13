const absoluteValue = require('./absoluteValue');

const Node = require('../../node');
const NthRoot = require('./nthRoot');
const TreeSearch = require('../../TreeSearch');

const FUNCTIONS = [
  NthRoot.nthRoot,
  absoluteValue
];

// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(functions);

// Evaluates a function call if possible. Returns a Node.Status object.
function functions(node) {
  if (!Node.Type.isFunction(node)) {
    return Node.Status.noChange(node);
  }

  for (let i = 0; i < FUNCTIONS.length; i++) {
    const nodeStatus = FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
  }
  return Node.Status.noChange(node);
}

module.exports = search;
