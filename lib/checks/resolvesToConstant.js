const {query} = require('math-nodes');

// Returns true if the node is a constant or can eventually be resolved to
// a constant.
// e.g. 2, 2+4, (2+4)^2 would all return true. x + 4 would return false
function resolvesToConstant(node) {
  if (query.isApply(node)) {
    return node.args.every(
      (child) => resolvesToConstant(child));
  }
  else if (query.isNumber(node)) {
    return true;
  }
  else if (query.isIdentifier(node)) {
    return false;
  }
  else if (node.type === 'Parentheses') {
    return resolvesToConstant(node.body);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }
}

module.exports = resolvesToConstant;
