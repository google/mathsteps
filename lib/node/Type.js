/*
  For determining the type of a math-parser node.
 */

const {query} = require('math-nodes')

const NodeType = {}

// TODO(porting): this should be more elegant, but I really don't want to replace
// the one symbol operators. Maybe I should be more open to change and update
// operators everywhere, or maybe there's a nicer way to write this function
NodeType.isOperator = function(node, operator = null) {
  // op can't be 'neg' because that's actually unary minus, which is a special
  // case and isn't considered an operator - this should maybe be renamed
  if (!query.isApply(node) || query.isNumber(node) || node.op === 'neg') {
    return false
  }

  let hasSupportedOperation = false

  if (query.isAdd(node)) {
    if (operator === '+') return true
    hasSupportedOperation = true
  } else if (query.isMul(node)) {
    if (operator === '*') return true
    hasSupportedOperation = true
  } else if (query.isDiv(node)) {
    if (operator === '/') return true
    hasSupportedOperation = true
  } else if (query.isPow(node)) {
    if (operator === '^') return true
    hasSupportedOperation = true
  }

  if (operator === null) {
    return hasSupportedOperation
  } else {
    return false
  }
}

NodeType.isParenthesis = function(node) {
  return query.isParens(node)
}

NodeType.isUnaryMinus = function(node) {
  return query.isNeg(node)
}

NodeType.isFunction = function(node, functionName = null) {
  if (!query.isApply(node) || query.isIdentifier(node.op)) {
    return false
  }

  if (functionName === null) {
    return true
  }

  if (functionName === 'abs') {
    return query.isAbs(node)
  }

  if (functionName === 'nthRoot') {
    return query.isNthRoot(node)
  }

  // TODO: support more functions?
  return false
}

NodeType.isSymbol = function(node, allowUnaryMinus = false) {
  if (query.isIdentifier(node)) {
    return true
  } else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    return NodeType.isSymbol(node.args[0], false)
  } else {
    return false
  }
}

NodeType.isConstant = function(node, allowUnaryMinus = false) {
  // TODO(math-nodes): let query.number take unary minus option
  if (node.type === 'Number') {
    return true
  } else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
    if (NodeType.isConstant(node.args[0], false)) {
      const value = parseFloat(node.args[0].value)
      return value >= 0
    } else {
      return false
    }
  } else {
    return false
  }
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
  return (Number.isInteger(parseFloat(numerator.value)) &&
          Number.isInteger(parseFloat(denominator.value)))
}

module.exports = NodeType
