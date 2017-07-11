const ChangeTypes = require('../ChangeTypes');
const checks = require('../checks');
const Equation = require('../equation/Equation');
const EquationOperations = require('./EquationOperations');
const EquationStatus = require('../equation/Status');
const evaluate = require('../util/evaluate');
const factor = require('../factor/stepThrough');
const flattenOperands = require('../util/flattenOperands');
const Node = require('../node');
const removeUnnecessaryParens = require('../util/removeUnnecessaryParens');
const simplifyExpressionNode = require('../simplifyExpression/stepThrough');
const Symbols = require('../Symbols');

const COMPARATOR_TO_FUNCTION = {
  '=': function(left, right) { return left === right; },
  '>': function(left, right) { return left > right; },
  '>=': function(left, right) { return left >= right; },
  '<': function(left, right) { return left < right; },
  '<=': function(left, right) { return left <= right; },
};

// Given a leftNode, rightNode and a comparator, will return the steps to get
// the solution. Possible solutions include:
// - solving for a variable (e.g. 'x=3' for '3x=4+5')
// - the result of comparing values (e.g. 'true' for 3 = 3, 'false' for 3 < 2)
function stepThrough(leftNode, rightNode, comparator, debug=false) {
  let equation = new Equation(leftNode, rightNode, comparator);

  if (debug) {
    // eslint-disable-next-line
    console.log('\n\nSolving: ' + equation.print(false, true));
  }

  // we can't solve/find steps if there are any unsupported nodes
  if (checks.hasUnsupportedNodes(equation.leftNode) ||
      checks.hasUnsupportedNodes(equation.rightNode)) {
    return [];
  }

  const symbolSet = Symbols.getSymbolsInEquation(equation);

  if (symbolSet.size === 0) {
    return solveConstantEquation(equation, debug);
  }
  const symbolName = symbolSet.values().next().value;

  let equationStatus;
  let steps = [];

  const originalEquationStr = equation.print();
  const MAX_STEP_COUNT = 20;
  let iters = 0;

  // Checks if there are roots in the original equation before we
  // do any simplification.
  // E.g. (33 + 89) (x - 99) = 0
  if (checks.canFindRoots(equation)) {
    const [solutions, symbol] = getSolutionsAndSymbol(equation);

    const roots = new Equation(symbol, solutions[0], '=');
    steps.push(new EquationStatus(
      ChangeTypes.FIND_ROOTS, equation, roots));

    return steps;
  }

  // Step through the math equation until nothing changes
  do {
    steps = addSimplificationSteps(steps, equation, debug);

    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      equation = Equation.createEquationFromString(
        lastStep.newEquation.print(), equation.comparator);
    }

    equation.leftNode = flattenOperands(equation.leftNode);
    equation.rightNode = flattenOperands(equation.rightNode);

    // at this point, the symbols might have cancelled out.
    if (Symbols.getSymbolsInEquation(equation).size === 0) {
      return solveConstantEquation(equation, debug, steps);
    }

    if (checks.canFindRoots(equation)) {
      const [solutions, symbol] = getSolutionsAndSymbol(equation);

      // Returning a single solution for now.
      const roots = new Equation(symbol, solutions[0], '=');
      steps.push(new EquationStatus(
        ChangeTypes.FIND_ROOTS, equation, roots));

      return steps;
    }

    try {
      equationStatus = step(equation, symbolName);
    }
    catch (e) {
      // This error happens for some math that we don't support
      if (e.message.startsWith('No term with symbol: ')) {
        // eslint-disable-next-line
        console.error('Math error: ' + e.message + ', returning no steps');
        return [];
      }
      else {
        throw e; // bubble up
      }
    }

    if (equationStatus.hasChanged()) {
      if (equationStatus.newEquation.print().length > 300) {
        // eslint-disable-next-line
        throw Error('Math error: Potential infinite loop for equation ' +
                    originalEquationStr +  '. It reached over 300 characters '+
                    ' long, so returning no steps');
      }
      if (debug) {
        logSteps(equationStatus);
      }
      steps.push(equationStatus);
    }

    equation = EquationStatus.resetChangeGroups(equationStatus.newEquation);
    if (iters++ === MAX_STEP_COUNT) {
      // eslint-disable-next-line
      console.error('Math error: Potential infinite loop for equation: ' +
                    originalEquationStr + ', returning no steps');
      return [];
    }
  } while (equationStatus.hasChanged());

  return steps;
}

/*
  Helper function that returns the roots and symbol of an input equation
  that has roots to be found.
  For every factor on the left hand side, solve a new equation that is factor = 0
  for the symbol.
  TODO: handle multiple variable solutions e.g (x + 2) (y + 2) = 0
  TODO: how would we represent multiplicity of roots
*/

function getSolutionsAndSymbol (equation) {
  const left = equation.leftNode;
  const rightNode = Node.Creator.constant(0);

  const solutions = [];

  let symbol, steps, factorsWithSymbols;

  // If left hand side is a power node and it does not resolve to a constant (e.g. 2^7)
  // then it is a factor. If left hand side is a multiplication node, return a list of all the valid factors.
  if (Node.Type.isOperator(left, '^') && !checks.resolvesToConstant(left)){
    factorsWithSymbols = [left];
  }
  else {
    factorsWithSymbols = equation.leftNode.args.filter(arg => !checks.resolvesToConstant(arg));
  }

  // For each factor, solve the equation factor = 0 for the symbol
  // If the factor is a power node, solve the equation base = 0 for the symbol
  for (var f in factorsWithSymbols) {
    let factor = factorsWithSymbols[f];

    let leftNode;

    if (Node.Type.isOperator(factor, '^')) {
      factor = factor.args[0];
    }

    leftNode = Node.Type.isParenthesis(factor)
      ? factor.content
      : factor;

    steps = stepThrough(leftNode, rightNode, '=');

    if (steps.length > 0) {
      // e.g. x - 2 = 0
      const lastStep = steps.slice(-1)[0];

      symbol = lastStep.newEquation.leftNode;

      // Append to a list of roots
      if (Node.Type.isSymbol(symbol)) {
        solutions.push(lastStep.newEquation.rightNode);
      }
    }
    else {
      // e.g. x = 0
      symbol = leftNode;
      if (Node.Type.isSymbol(symbol)) {
        solutions.push(rightNode);
      }
    }
  }
 
  return [solutions, symbol];
}

// Given an equation of constants, will simplify both sides, returning
// the steps and the result of the equation e.g. 'True' or 'False'
function solveConstantEquation(equation, debug, steps=[]) {
  const compareFunction = COMPARATOR_TO_FUNCTION[equation.comparator];

  if (!compareFunction) {
    throw Error('Unexpected comparator');
  }

  steps = addSimplificationSteps(steps, equation, true, debug);
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    equation = Equation.createEquationFromString(
      lastStep.newEquation.print(), equation.comparator);
  }

  // If the left or right side didn't have any steps, unnecessary parens
  // might not have been removed, so do that now.
  equation.leftNode = removeUnnecessaryParens(equation.leftNode);
  equation.rightNode = removeUnnecessaryParens(equation.rightNode);

  if (!Node.Type.isConstantOrConstantFraction(equation.leftNode, true) ||
      !Node.Type.isConstantOrConstantFraction(equation.rightNode, true)) {
    throw Error('Expected both nodes to be constants, instead got: ' +
                equation.print());
  }

  const leftValue = evaluate(equation.leftNode);
  const rightValue = evaluate(equation.rightNode);
  let changeType;
  if (compareFunction(leftValue, rightValue)) {
    changeType = ChangeTypes.STATEMENT_IS_TRUE;
  }
  else {
    changeType = ChangeTypes.STATEMENT_IS_FALSE;
  }

  // there's no oldEquation or change groups because nothing actually changes
  // here, it's just a final step that states the solution
  const equationStatus = new EquationStatus(changeType, null, equation);
  if (debug) {
    logSteps(equationStatus);
  }
  steps.push(equationStatus);
  return steps;
}

// Given a symbol and an equation, performs a single step to
// solve for the symbol. Returns an Status object.
function step(equation, symbolName) {
  const solveFunctions = [
    // ensure the symbol is always on the left node
    EquationOperations.ensureSymbolInLeftNode,
    // get rid of denominators that have the symbol
    EquationOperations.removeSymbolFromDenominator,
    // remove the symbol from the right side
    EquationOperations.removeSymbolFromRightSide,
    // isolate the symbol on the left side
    EquationOperations.isolateSymbolOnLeftSide,
  ];

  for (let i = 0; i < solveFunctions.length; i++) {
    const equationStatus = solveFunctions[i](equation, symbolName);

    if (equationStatus.hasChanged()) {
      return equationStatus;
    }
  }
  return EquationStatus.noChange(equation);
}

// Simplifies the equation and returns the simplification steps
function addSimplificationSteps(steps, equation, debug=false) {
  let oldEquation = equation.clone();

  /*
    Collects substeps for factoring and simplifying the expression separately
    because their logics are located in different places. Collect factoring
    substeps first in case the original expression is factorable. If no factoring
    substeps, proceed to collect simplifying substeps.
    Some examples of when this comes into play:
    e.g. x * x + 3x + 2 = 0 <- factor the left side
    e.g. x + 4 + 2 = 0 <- simplify the left side 
  */
  const leftSteps = simplifyExpressionNode(equation.leftNode, false);
  const simplifiedLeftNode = leftSteps.length !== 0
        ? leftSteps.slice(-1)[0].newNode
        : equation.leftNode;
  const leftFactorSteps = factor(simplifiedLeftNode, false);

  const leftSubSteps = [];

  for (let i = 0; i < leftFactorSteps.length; i++) {
    const step = leftFactorSteps[i];
    leftSubSteps.push(EquationStatus.addLeftStep(equation, step));
  }

  if (leftSubSteps.length === 0) {
    for (let i = 0; i < leftSteps.length; i++) {
      const step = leftSteps[i];
      leftSubSteps.push(EquationStatus.addLeftStep(equation, step));
    }
  }

  if (leftSubSteps.length === 1) {
    const step = leftSubSteps[0];
    if (debug) {
      logSteps(step);
    }
    steps.push(step);
  }
  else if (leftSubSteps.length > 1) {
    const lastStep = leftSubSteps[leftSubSteps.length - 1];
    const finalEquation = EquationStatus.resetChangeGroups(lastStep.newEquation);
    // no change groups are set here - too much is changing for it to be useful
    const simplifyStatus = new EquationStatus(
      ChangeTypes.SIMPLIFY_LEFT_SIDE,
      oldEquation, finalEquation, leftSubSteps);
    if (debug) {
      logSteps(simplifyStatus);
    }
    steps.push(simplifyStatus);
  }

  // update `equation` to have the new simplified left node
  if (steps.length > 0) {
    equation = EquationStatus.resetChangeGroups(
      steps[steps.length - 1].newEquation);
  }

  // the updated equation from simplifing the left side is the old equation
  // (ie the "before" of the before and after) for simplifying the right side.
  oldEquation = equation.clone();

  const rightSteps = simplifyExpressionNode(equation.rightNode, false);
  const rightFactorSteps = factor(equation.rightNode, false);
  const rightSubSteps = [];

  for (let i = 0; i < rightFactorSteps.length; i++) {
    const step = rightFactorSteps[i];
    rightSubSteps.push(EquationStatus.addRightStep(equation, step));
  }

  if (rightSubSteps.length === 0) {
    for (let i = 0; i < rightSteps.length; i++) {
      const step = rightSteps[i];
      rightSubSteps.push(EquationStatus.addRightStep(equation, step));
    }
  }

  if (rightSubSteps.length === 1) {
    const step = rightSubSteps[0];
    if (debug) {
      logSteps(step);
    }
    steps.push(step);
  }
  else if (rightSubSteps.length > 1) {
    const lastStep = rightSubSteps[rightSubSteps.length - 1];
    const finalEquation = EquationStatus.resetChangeGroups(lastStep.newEquation);
    // no change groups are set here - too much is changing for it to be useful
    const simplifyStatus = new EquationStatus(
      ChangeTypes.SIMPLIFY_RIGHT_SIDE,
      oldEquation, finalEquation, rightSubSteps);
    if (debug) {
      logSteps(simplifyStatus);
    }
    steps.push(simplifyStatus);
  }

  return steps;
}

function logSteps(equationStatus) {
  // eslint-disable-next-line
  console.log('\n' + equationStatus.changeType);
  // eslint-disable-next-line
  console.log(equationStatus.newEquation.print());
  if (equationStatus.substeps.length > 0) {
    // eslint-disable-next-line
    console.log('\n substeps: ');
    equationStatus.substeps.forEach(logSteps);
  }
}


module.exports = stepThrough;
