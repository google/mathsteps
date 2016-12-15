'use strict';

const absoluteValue = require('./absoluteValue');
const nthRoot = require('./nthRoot');

const NodeStatus = require('../util/NodeStatus');
const NodeType = require('../util/NodeType');
const TreeSearch = require('../util/TreeSearch');

const FUNCTIONS = [
  nthRoot,
  absoluteValue
];

// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a NodeStatus object.
const evaluateFunctionsTreeSearch = TreeSearch.postOrder(evaluateFunctions);

// Evaluates a function call if possible. Returns a NodeStatus object.
function evaluateFunctions(node) {
  if (!NodeType.isFunction(node)) {
    return NodeStatus.noChange(node);
  }

  for (let i = 0; i < FUNCTIONS.length; i++) {
    let nodeStatus = FUNCTIONS[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
  }
  return NodeStatus.noChange(node);
}

module.exports = evaluateFunctionsTreeSearch;
