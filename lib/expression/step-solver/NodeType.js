'use strict';
/*
  For determining the type of a mathJS node.
 */

const NodeType = {}

NodeType.isOperator = function(node) {
  return node.type === 'OperatorNode' &&
         node.fn !== 'unaryMinus' &&
         '*+-/^'.includes(node.op);
};

NodeType.isParenthesis = function(node) {
  return node.type === 'ParenthesisNode';
};

NodeType.isUnaryMinus = function(node) {
  return node.type === 'OperatorNode' && node.fn === 'unaryMinus';
};

NodeType.isFunction = function(node, functionName=null) {
  if (node.type !== 'FunctionNode') {
    return false;
  }
  if (functionName && node.fn.name !== functionName) {
    return false;
  }
  return true;
};

NodeType.isSymbol = function(node, allowUnaryMinus=true) {
  if (node.type === 'SymbolNode') {
    return true;
  }
  else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return NodeType.isSymbol(node.args[0], false);
  }
  else {
    return false;
  }
};

NodeType.isConstant = function(node, allowUnaryMinus=false) {
  if (node.type === 'ConstantNode') {
    return true;
  }
  else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return NodeType.isConstant(node.args[0], false);
  }
  else {
    return false;
  }
};

NodeType.isConstantFraction = function(node, allowUnaryMinus=false) {
  if (NodeType.isOperator(node) && node.op === '/') {
    return node.args.every(n => NodeType.isConstant(n, allowUnaryMinus));
  }
  else {
    return false;
  }
}

NodeType.isConstantOrConstantFraction = function(node, allowUnaryMinus=false) {
  if (NodeType.isConstant(node, allowUnaryMinus) ||
      NodeType.isConstantFraction(node, allowUnaryMinus)) {
    return true;
  }
  else {
    return false;
  }
}

NodeType.isIntegerFraction = function(node) {
  if (!NodeType.isConstantFraction(node)) {
    return false;
  }
  return (Number.isInteger(parseFloat(node.args[0].value)) &&
          Number.isInteger(parseFloat(node.args[1].value)));
}


module.exports = NodeType;
