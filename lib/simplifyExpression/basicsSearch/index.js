/*
 * Performs simpifications that are more basic and overaching like (...)^0 => 1
 * These are always the first simplifications that are attempted.
 */

const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');
const basic_rules = require('./basicRules.js')

const SIMPLIFICATION_FUNCTIONS = Object.keys(basic_rules);

const search = TreeSearch.preOrder(basics);

// Look for basic step(s) to perform on a node. Returns a Node.Status object.
function basics(node) {
  for (let i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
    const nodeStatus = basic_rules[i](node);
    if (nodeStatus.hasChanged()) {
      return nodeStatus;
    }
    else {
      node = nodeStatus.newNode;
    }
  }
  return Node.Status.noChange(node);
}

module.exports = search;
