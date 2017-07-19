// Operations on equation nodes

const ChangeTypes = require('../ChangeTypes');
const clone = require('../util/clone');
const Equation = require('../equation/Equation');
const EquationStatus = require('../equation/Status');
const Negative = require('../Negative');
const Node = require('../node');
const Symbols = require('../Symbols');

const COMPARATOR_TO_INVERSE = {
  '>': '<',
  '>=': '<=',
  '<': '>',
  '<=': '>=',
  '=': '='
};

const EquationOperations = {};

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
      const comparator = COMPARATOR_TO_INVERSE[equation.comparator];
      const oldEquation = equation;
      const newEquation = new Equation(
        equation.rightNode, equation.leftNode, comparator);
      // no change groups are set for this step because everything changes, so
      // they wouldn't be pedagogically helpful.
      return new EquationStatus(
        ChangeTypes.SWAP_SIDES, oldEquation, newEquation);
    }
    else {
      throw Error('No term with symbol: ' + symbolName);
    }
  }
  return EquationStatus.noChange(equation);
};

// Ensures that a symbol is not in the denominator by multiplying
// both sides by the denominator if there is a symbol present.
EquationOperations.removeSymbolFromDenominator = function(equation, symbolName) {
  // Can't multiply a symbol across non-equal comparators
  // because you don't know if it's negative and need to flip the sign
  if (equation.comparator !== '=') {
    return EquationStatus.noChange(equation);
  }
  const leftNode = equation.leftNode;
  const denominator = Symbols.getLastDenominatorWithSymbolTerm(leftNode, symbolName);
  if (denominator) {
    return performTermOperationOnEquation(
      equation, '*', denominator, ChangeTypes.MULTIPLY_TO_BOTH_SIDES);
  }
  return EquationStatus.noChange(equation);
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
    return EquationStatus.noChange(equation);
  }

  // Clone it so that any operations on it don't affect the node already
  // in the equation
  symbolTerm = clone(symbolTerm);

  if (Node.PolynomialTerm.isPolynomialTerm(rightNode)) {
    if (Negative.isNegative(symbolTerm)) {
      inverseOp = '+';
      changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
      inverseTerm = Negative.negate(symbolTerm);
    }
    else {
      inverseOp = '-';
      changeType = ChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
      inverseTerm = symbolTerm;
    }
  }
  else if (Node.Type.isOperator(rightNode)) {
    if (rightNode.op === '+') {
      if (Negative.isNegative(symbolTerm)) {
        inverseOp = '+';
        changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
        inverseTerm = Negative.negate(symbolTerm);
      }
      else {
        inverseOp = '-';
        changeType = ChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
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
  else if (Node.Type.isUnaryMinus(rightNode)) {
    inverseOp = '+';
    changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
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
    return EquationStatus.noChange(equation);
  }

  // Clone it so that any operations on it don't affect the node already
  // in the equation
  nonSymbolTerm = clone(nonSymbolTerm);

  if (Node.Type.isOperator(leftNode)) {
    if (leftNode.op === '+') {
      if (Negative.isNegative(nonSymbolTerm)) {
        inverseOp = '+';
        changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
        inverseTerm = Negative.negate(nonSymbolTerm);
      }
      else {
        inverseOp = '-';
        changeType = ChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
        inverseTerm = nonSymbolTerm;
      }
    }
    else if (leftNode.op === '*') {
      if (Node.Type.isConstantFraction(nonSymbolTerm)) {
        inverseOp = '*';
        changeType = ChangeTypes.MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION;
        inverseTerm = Node.Creator.operator(
          '/', [nonSymbolTerm.args[1], nonSymbolTerm.args[0]]);
      }
      else {
        inverseOp = '/';
        changeType = ChangeTypes.DIVIDE_FROM_BOTH_SIDES;
        inverseTerm = nonSymbolTerm;
      }
    }
    else if (leftNode.op === '/') {
      // The non symbol term is always a fraction because it's the
      // coefficient of our symbol term.
      // If the numerator is 1, we multiply both sides by the denominator,
      // otherwise we multiply by the inverse
      if (['1', '-1'].indexOf(nonSymbolTerm.args[0].value) !== -1) {
        inverseOp = '*';
        changeType = ChangeTypes.MULTIPLY_TO_BOTH_SIDES;
        inverseTerm = nonSymbolTerm.args[1];
      }
      else {
        inverseOp = '*';
        changeType = ChangeTypes.MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION;
        inverseTerm = Node.Creator.operator(
          '/', [nonSymbolTerm.args[1], nonSymbolTerm.args[0]]);
      }
    }
    else if (leftNode.op === '^') {
      // TODO: support roots
      return EquationStatus.noChange(equation);
    }
    else {
      throw Error('Unsupported operation: ' + leftNode.op);
    }
  }
  else if (Node.Type.isUnaryMinus(leftNode)) {
    inverseOp = '*';
    changeType = ChangeTypes.MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE;
    inverseTerm =  Node.Creator.constant(-1);
  }
  else {
    throw Error('Unsupported node type: ' + leftNode.type);
  }

  return performTermOperationOnEquation(
      equation, inverseOp, inverseTerm, changeType);
};

// Modifies the left and right sides of an equation by `op`-ing `term`
// to both sides. Returns an Status object.
function performTermOperationOnEquation(equation, op, term, changeType) {
  const oldEquation = equation.clone();

  const leftTerm = clone(term);
  const rightTerm = clone(term);
  const leftNode = performTermOperationOnExpression(
    equation.leftNode, op, leftTerm);
  const rightNode = performTermOperationOnExpression(
    equation.rightNode, op, rightTerm);

  let comparator = equation.comparator;
  if (Negative.isNegative(term) && (op === '*' || op === '/')) {
    comparator = COMPARATOR_TO_INVERSE[comparator];
  }

  const newEquation = new Equation(leftNode, rightNode, comparator);
  return new EquationStatus(changeType, oldEquation, newEquation);
}

// Performs an operation of a term on an entire given expression
function performTermOperationOnExpression(expression, op, term) {
  const node = (Node.Type.isOperator(expression) ?
    Node.Creator.parenthesis(expression) : expression);

  term.changeGroup = 1;
  const newNode = Node.Creator.operator(op, [node, term]);

  return newNode;
}

module.exports = EquationOperations;
