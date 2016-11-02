'use strict';

const NodeType = require('./NodeType');

function hasUnsupportedNodes(node, onlyConst=false) {
  if (NodeType.isParenthesis(node)) {
    return hasUnsupportedNodes(node.content, onlyConst);
  }
  else if (NodeType.isUnaryMinus(node)) {
    return hasUnsupportedNodes(node.args[0], onlyConst);
  }
  else if (NodeType.isOperator(node)) {
    return node.args.some(arg => hasUnsupportedNodes(arg, onlyConst));
  }
  else if (NodeType.isSymbol(node)) {
    return onlyConst;
  }
  else if (NodeType.isConstant(node)) {
    return false;
  }
  else if (NodeType.isFunction(node, "abs")) {
    return node.args.some(arg => hasUnsupportedNodes(arg, true));
  }
  else {
    return true;
  }
}

module.exports = hasUnsupportedNodes;
