const Node = require('../node');
const resolvesToConstant = require('./resolvesToConstant');

function hasUnsupportedNodes(node) {
  if (Node.Type.isParenthesis(node)) {
    return hasUnsupportedNodes(node.content);
  }
  else if (Node.Type.isUnaryMinus(node)) {
    return hasUnsupportedNodes(node.args[0]);
  }
  else if (Node.Type.isOperator(node)) {
    return node.args.some(hasUnsupportedNodes);
  }
  else if (Node.Type.isSymbol(node) || Node.Type.isConstant(node)) {
    return false;
  }
  else if (Node.Type.isFunction(node, 'abs')) {
    if (node.args.length !== 1) {
      return true;
    }
    if (node.args.some(hasUnsupportedNodes)) {
      return true;
    }
    return !resolvesToConstant(node.args[0]);
  }
  else if (Node.Type.isFunction(node, 'nthRoot')) {
    return node.args.some(hasUnsupportedNodes) || node.args.length < 1;
  }
  else {
    return true;
  }
}

module.exports = hasUnsupportedNodes;
