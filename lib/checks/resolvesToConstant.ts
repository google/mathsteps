import mathNode = require('../mathnode');


// Returns true if the node is a constant or can eventually be resolved to
// a constant.
// e.g. 2, 2+4, (2+4)^2 would all return true. x + 4 would return false
function resolvesToConstant(node: any);
function resolvesToConstant(node) {
  if (mathNode.Type.isOperator(node) || mathNode.Type.isFunction(node)) {
    return node.args.every(
      (child) => resolvesToConstant(child));
  }
  else if (mathNode.Type.isParenthesis(node)) {
    return resolvesToConstant(node.content);
  }
  else if (mathNode.Type.isConstant(node, true)) {
    return true;
  }
  else if (mathNode.Type.isSymbol(node)) {
    return false;
  }
  else if (mathNode.Type.isUnaryMinus(node)) {
    return resolvesToConstant(node.args[0]);
  }
  else {
    throw Error('Unsupported node type: ' + node.type);
  }
}

export = resolvesToConstant;
