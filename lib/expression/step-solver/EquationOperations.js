'use strict';
// Operations on equation nodes

const clone = require('clone');
const Equation = require('./Equation');
const EquationStatus = require('./EquationStatus');
const MathChangeTypes = require('./MathChangeTypes');
const Negative = require('./Negative.js');
const NodeCreator = require('./NodeCreator');
const NodeType = require('./NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');
const Symbols = require('./Symbols.js');

const COMPARATOR_TO_INVERSE = {
  '>': '<',
  '>=': '<=',
  '<': '>',
  '<=': '>=',
  '=': '='
};

class EquationOperations {}

// Ensures that the given equation has the given symbolName on the left side,
// by swapping the right and left sides if it is only in the right side.
// So 3 = x would become x = 3.
EquationOperations.ensureSymbolInLeftNode = function(equation, symbolName) {
  const leftSideSymbolTerm = Symbols.getLastSymbolTerm(
    equation.leftNode, symbolName);
  const rightSideSymbolTerm = Symbols.getLastSymbolTerm(
    equation.rightNode, symbolName);

  if (!leftSideSymbolTerm) {
    if (rightSideSymbolTerm) {
      equation = new Equation(
        equation.rightNode, equation.leftNode, equation.comparator);
      return new EquationStatus(equation, MathChangeTypes.SWAP_SIDES);
    }
    else {
      throw Error('No term with symbol: ' + symbolName);
    }
  }
  return new EquationStatus(equation);
};

// TODO: Ensures that a symbol is not in the denominator by multiplying
// both sides by the whatever order of the symbol necessary.
// This is blocked on the simplifying functionality of canceling symbols in fractions
EquationOperations.removeSymbolFromDenominator = function(equation) {
  // pass for now
  return new EquationStatus(equation);
};

// Removes the given symbolName from the right side by adding or subtracting
// it from both sides as appropriate.
// e.g. 2x = 3x + 5 --> 2x - 3x = 5
// There are actually no cases where we'd remove symbols from the right side
// by multiplying or dividing by a symbol term.
// TODO: support inverting functions e.g. sqrt, ^, log etc.
EquationOperations.removeSymbolFromRightSide = function(equation, symbolName) {
  const rightNode = equation.rightNode;
  let symbolTerm = Symbols.getLastSymbolTerm(rightNode, symbolName);

  let inverseOp, inverseTerm, changeType;
  if (!symbolTerm){
    return new EquationStatus(equation);
  }

  // Clone it so that any operations on it don't affect the node already
  // in the equation
  symbolTerm = clone(symbolTerm, false);

  if (PolynomialTermNode.isPolynomialTerm(rightNode)) {
    if (Negative.isNegative(symbolTerm)) {
      inverseOp = '+';
      changeType = MathChangeTypes.ADD_TO_BOTH_SIDES;
      inverseTerm = Negative.negate(symbolTerm);
    }
    else {
      inverseOp = '-';
      changeType = MathChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
      inverseTerm = symbolTerm;
    }
  }
  else if (NodeType.isOperator(rightNode)) {
    if (rightNode.op === '+') {
      if (Negative.isNegative(symbolTerm)) {
        inverseOp = '+';
        changeType = MathChangeTypes.ADD_TO_BOTH_SIDES;
        inverseTerm = Negative.negate(symbolTerm);
      }
      else {
        inverseOp = '-';
        changeType = MathChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
        inverseTerm = symbolTerm;
      }
    }
    else {
      // Note that operator '-' won't show up here because subtraction is
      // flattened into adding the negative. See 'TRICKY catch' in the README
      // for more details.
      throw Error('Unsupported operation: ' + symbolTerm.op);
    }
  }
  else if (NodeType.isUnaryMinus(rightNode)) {
    inverseOp = '+';
    changeType = MathChangeTypes.ADD_TO_BOTH_SIDES;
    inverseTerm = symbolTerm.args[0];
  }
  else {
    throw Error('Unsupported node type: ' + rightNode.type);
  }
  return performTermOperationOnEquation(
      equation, inverseOp, inverseTerm, changeType);
};

// Isolates the given symbolName to the left side by adding, multiplying, subtracting
// or dividing all other symbols and constants from both sides appropriately
// TODO: support inverting functions e.g. sqrt, ^, log etc.
EquationOperations.isolateSymbolOnLeftSide = function(equation, symbolName) {
  const leftNode = equation.leftNode;
  let nonSymbolTerm = Symbols.getLastNonSymbolTerm(leftNode, symbolName);

  let inverseOp, inverseTerm, changeType;
  if (!nonSymbolTerm) {
    return new EquationStatus(equation);
  }

  // Clone it so that any operations on it don't affect the node already
  // in the equation
  nonSymbolTerm = clone(nonSymbolTerm, false);

  if (NodeType.isOperator(leftNode)) {
    if (leftNode.op === '+') {
      if (Negative.isNegative(nonSymbolTerm)) {
        inverseOp = '+';
        changeType = MathChangeTypes.ADD_TO_BOTH_SIDES;
        inverseTerm = Negative.negate(nonSymbolTerm);
      }
      else {
        inverseOp = '-';
        changeType = MathChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
        inverseTerm = nonSymbolTerm;
      }
    }
    else if (leftNode.op === '*') {
      if (NodeType.isConstantFraction(nonSymbolTerm)) {
        inverseOp = '*';
        changeType = MathChangeTypes.MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION;
        inverseTerm = NodeCreator.operator(
          '/', [nonSymbolTerm.args[1], nonSymbolTerm.args[0]]);
      }
      else {
        inverseOp = '/';
        changeType = MathChangeTypes.DIVIDE_FROM_BOTH_SIDES;
        inverseTerm = nonSymbolTerm;
      }
    }
    else if (leftNode.op === '/') {
      if (NodeType.isConstantFraction(nonSymbolTerm) &&
          PolynomialTermNode.isPolynomialTerm(leftNode)) {
        inverseOp = '*';
        changeType = MathChangeTypes.MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION;
        inverseTerm = NodeCreator.operator(
          '/', [nonSymbolTerm.args[1], nonSymbolTerm.args[0]]);
      }
      else {
        inverseOp = '*';
        changeType = MathChangeTypes.MULTIPLY_TO_BOTH_SIDES;
        inverseTerm = nonSymbolTerm;
      }
    }
    else if (leftNode.op === '^') {
      // TODO: support roots
      return new EquationStatus(equation);
    }
    else {
      throw Error('Unsupported operation: ' + leftNode.op);
    }
  }
  else if (NodeType.isUnaryMinus(leftNode)) {
    inverseOp = '*';
    changeType = MathChangeTypes.MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE;
    inverseTerm =  NodeCreator.constant(-1);
  }
  else {
    throw Error('Unsupported node type: ' + leftNode.type);
  }

  return performTermOperationOnEquation(
      equation, inverseOp, inverseTerm, changeType);
};

// Modifies the left and right sides of an equation by `op`-ing `term`
// to both sides. Returns an EquationStatus object.
function performTermOperationOnEquation(equation, op, term, changeType) {
  const leftTerm = clone(term, false);
  const rightTerm = clone(term, false);
  let leftNode = performTermOperationOnExpression(
    equation.leftNode, op, leftTerm);
  let rightNode = performTermOperationOnExpression(
    equation.rightNode, op, rightTerm);

  let comparator = equation.comparator;
  if (Negative.isNegative(term) && (op === '*' || op === '/')) {
    comparator = COMPARATOR_TO_INVERSE[comparator];
  }

  equation = new Equation(leftNode, rightNode, comparator);
  return new EquationStatus(equation, changeType);
}

// Performs an operation of a term on an entire given expression
function performTermOperationOnExpression(expression, op, term) {
  let node = (NodeType.isOperator(expression) ?
    NodeCreator.parenthesis(expression) : expression);

  return NodeCreator.operator(op, [node, term]);
}

module.exports = EquationOperations;
