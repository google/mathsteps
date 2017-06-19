const {query} = require('math-nodes');

const resolvesToConstant = require('./resolvesToConstant');

function hasUnsupportedNodes(node) {
  if (query.isApply(node)) {
    if (query.isAbs(node)) {
      if (node.args.length !== 1) {
        return true;
      }
      if (!resolvesToConstant(node.args[0])) {
        return true;
      }
    }
    else if (query.isNthRoot(node)) {
      if (node.args.length < 1 || node.args.length > 2) {
        return true;
      }
    }
    return node.args.some(hasUnsupportedNodes);
  }
  else if (query.isIdentifier(node) || query.isNumber(node)) {
    return false;
  }
  else {
    return true;
  }
}

module.exports = hasUnsupportedNodes;
