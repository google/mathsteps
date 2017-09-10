const Node = require('../node');

// Searches through the full node tree and returns all nodes that match the
// given condition

function filter(rootNode, matchesCondition) {
  let nodesToCheck = [rootNode];
  const matchingNodes = [];

  while (nodesToCheck.length > 0) {
    const node = nodesToCheck.pop();

    if (matchesCondition(node)) {
      matchingNodes.push(node);
    }

    if (node.args) {
      nodesToCheck = nodesToCheck.concat(node.args);
    }
    else if (Node.Type.isParenthesis(node)) {
      nodesToCheck.push(node.body);
    }
  }

  return matchingNodes;
}

module.exports = filter;
