import mathNode = require('../mathnode');
import resolvesToConstant = require('./resolvesToConstant');

function hasUnsupportedNodes(node: any);
function hasUnsupportedNodes(node) {
  if (mathNode.Type.isParenthesis(node)) {
    return hasUnsupportedNodes(node.content);
  }
  else if (mathNode.Type.isUnaryMinus(node)) {
    return hasUnsupportedNodes(node.args[0]);
  }
  else if (mathNode.Type.isOperator(node)) {
    return node.args.some(hasUnsupportedNodes);
  }
  else if (mathNode.Type.isSymbol(node) || mathNode.Type.isConstant(node)) {
    return false;
  }
  else if (mathNode.Type.isFunction(node, 'abs')) {
    if (node.args.length !== 1) {
      return true;
    }
    if (node.args.some(hasUnsupportedNodes)) {
      return true;
    }
    return !resolvesToConstant(node.args[0]);
  }
  else if (mathNode.Type.isFunction(node, 'nthRoot')) {
    return node.args.some(hasUnsupportedNodes) || node.args.length < 1;
  }
  else {
    return true;
  }
}

export = hasUnsupportedNodes;
