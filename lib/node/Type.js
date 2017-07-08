/*
  For determining the type of a mathJS node.
 */

const NodeType = {};

NodeType.isOperator = function(node, operator=null) {
  return node.type === 'OperatorNode' &&
         node.fn !== 'unaryMinus' &&
         '*+-/^'.includes(node.op) &&
         (operator ? node.op === operator : true);
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
    if (NodeType.isConstant(node.args[0], false)) {
      const value = parseFloat(node.args[0].value);
      return value >= 0;
    }
    else {
      return false;
    }
  }
  else {
    return false;
  }
};

NodeType.isConstantFraction = function(node, allowUnaryMinus=false) {
  if (NodeType.isOperator(node, '/')) {
    return node.args.every(n => NodeType.isConstant(n, allowUnaryMinus));
  }
  else {
    return false;
  }
};

NodeType.isConstantOrConstantFraction = function(node, allowUnaryMinus=false) {
  if (NodeType.isConstant(node, allowUnaryMinus) ||
      NodeType.isConstantFraction(node, allowUnaryMinus)) {
    return true;
  }
  else {
    return false;
  }
};

NodeType.isIntegerFraction = function(node, allowUnaryMinus=false) {
  if (!NodeType.isConstantFraction(node, allowUnaryMinus)) {
    return false;
  }
  let numerator = node.args[0];
  let denominator = node.args[1];
  if (allowUnaryMinus) {
    if (NodeType.isUnaryMinus(numerator)) {
      numerator = numerator.args[0];
    }
    if (NodeType.isUnaryMinus(denominator)) {
      denominator = denominator.args[0];
    }
  }
  return (Number.isInteger(parseFloat(numerator.value)) &&
          Number.isInteger(parseFloat(denominator.value)));
};

// Returns true if `node` belongs to the type specified by boolean `isTypeFunc`.
// If `allowParens` is true, we allow for the node to be nested within parenthesis.
NodeType.isType = function(node, isTypeFunc, allowParens=true) {
  if (isTypeFunc(node)) {
    return true;
  }
  else if (allowParens && NodeType.isParenthesis(node)) {
    return NodeType.isType(node.content, isTypeFunc, allowParens);
  }

  return false;
};

// Returns `node` if `node` belongs to the type specified by boolean `isTypeFunc`.
// If `allowParens` is true, we check for an inner node of this type.
NodeType.getType = function(node, isTypeFunc, allowParens=true) {
  if (isTypeFunc(node)) {
    return node;
  }
  else if (allowParens && NodeType.isParenthesis(node)) {
    return NodeType.getType(node.content, isTypeFunc, allowParens);
  }

  throw Error('`getType` called on a node that does not belong to specified type');
};

NodeType.isFraction = function(node, allowParens=true) {
  return NodeType.isType(
    node,
    function(node) { return NodeType.isOperator(node, '/'); },
    allowParens);
};

NodeType.getFraction = function(node,  allowParens=true) {
  return NodeType.getType(
    node,
    function(node) { return NodeType.isOperator(node, '/'); },
    allowParens);
};

module.exports = NodeType;
