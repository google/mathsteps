/*
  For determining the type of a mathJS node.
 */

const math = require('mathjs')

const NodeType = {}

NodeType.isOperator = function(node, operator = null) {
  return node.type === 'OperatorNode' &&
         node.fn !== 'unaryMinus' &&
         '*+-/^'.includes(node.op) &&
         (operator ? node.op === operator : true)
}

NodeType.isParenthesis = function(node) {
  return node.type === 'ParenthesisNode'
}

NodeType.isUnaryMinus = function(node) {
  return node.type === 'OperatorNode' && node.fn === 'unaryMinus'
}

NodeType.isFunction = function(node, functionName = null) {
  if (node.type !== 'FunctionNode') {
    return false
  }
  if (functionName && (node.fn.name !== functionName)) {
    return false
  }
  return true
}

NodeType.isNthRoot = function(node) {
  return NodeType.isFunction(node, 'nthRoot') ||
         NodeType.isFunction(node, 'sqrt')
}

NodeType.isSymbol = function(node, allowUnaryMinus = false) {
  if (node.type === 'SymbolNode') {
    return true
  } else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return NodeType.isSymbol(node.args[0], false)
  } else {
    return false
  }
}

NodeType.isConstant = function(node, allowUnaryMinus = false) {
  if (node.type === 'ConstantNode') {
    return true
  } else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    if (NodeType.isConstant(node.args[0], false)) {
      return math.isNumeric(node.args[0].value)
    } else {
      return false
    }
  } else {
    return false
  }
}

// Function branch from al_mixed_numbers
// TODO: Review is it still useful?
NodeType.isMixedNumber = function(node, allowUnaryMinus = false) {
  if (node.op === '*'
      && NodeType.isConstant(node.args[0])
      && NodeType.isParenthesis(node.args[1])
      && NodeType.isConstantFraction(node.args[1].content)) {
    return true
  }
  return false
}

NodeType.isConstantFraction = function(node, allowUnaryMinus = false) {
  if (NodeType.isOperator(node, '/')) {
    return node.args.every(n => NodeType.isConstant(n, allowUnaryMinus))
  } else {
    return false
  }
}

NodeType.isConstantOrConstantFraction = function(node, allowUnaryMinus = false) {
  if (NodeType.isConstant(node, allowUnaryMinus) ||
      NodeType.isConstantFraction(node, allowUnaryMinus)) {
    return true
  } else {
    return false
  }
}

NodeType.isIntegerFraction = function(node, allowUnaryMinus = false) {
  if (!NodeType.isConstantFraction(node, allowUnaryMinus)) {
    return false
  }
  let numerator = node.args[0]
  let denominator = node.args[1]
  if (allowUnaryMinus) {
    if (NodeType.isUnaryMinus(numerator)) {
      numerator = numerator.args[0]
    }
    if (NodeType.isUnaryMinus(denominator)) {
      denominator = denominator.args[0]
    }
  }

  return (math.isInteger(numerator.value) &&
          math.isInteger(denominator.value))
}

NodeType.kemuIsConstantInteger = function(node, expectedValue) {
  const isConstant = (node.type === 'ConstantNode')

  if (expectedValue != null) {
    return isConstant && math.equal(node.value, expectedValue)
  } else {
    return isConstant && math.isInteger(node.value)
  }

  return rv
}

NodeType.isZero = function(node) {
  return NodeType.isConstant(node) && math.isZero(node.value)
}

NodeType.kemuIsConstantNegative = function(node) {
  return (node.type === 'ConstantNode') && math.isNegative(node.value)
}

NodeType.kemuIsConstantPositive = function(node) {
  return (node.type === 'ConstantNode') && math.isPositive(node.value)
}

NodeType.kemuIsConstantOrSymbol = function(node) {
  return NodeType.isConstant(node) || NodeType.isSymbol(node)
}

module.exports = NodeType
