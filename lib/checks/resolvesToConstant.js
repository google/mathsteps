const Node = require('../node');

// Returns true if the node is a constant or can eventually be resolved to
// a constant.
// e.g. 2, 2+4, (2+4)^2 would all return true. x + 4 would return false
function resolvesToConstant(node) {
  if (Node.Type.isOperator(node) || Node.Type.isFunction(node)) {
    return node.args.every(
      (child) => resolvesToConstant(child));
  }
  else if (Node.Type.isParenthesis(node)) {
    return resolvesToConstant(node.content);
  }
  else if (Node.Type.isConstant(node, true)) {
    return true;
  }
  else if (Node.Type.isSymbol(node)) {
    return false;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    return resolvesToConstant(node.args[0]);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }
}

module.exports = resolvesToConstant;
