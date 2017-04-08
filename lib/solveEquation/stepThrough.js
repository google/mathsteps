"use strict";
var ChangeTypes = require("../ChangeTypes");
var checks = require("../checks");
var Equation = require("../equation/Equation");
var EquationOperations = require("./EquationOperations");
var EquationStatus = require("../equation/Status");
var evaluate = require("../util/evaluate");
var flattenOperands = require("../util/flattenOperands");
var mathNode = require("../mathnode");
var removeUnnecessaryParens = require("../util/removeUnnecessaryParens");
var simplifyExpressionNode = require("../simplifyExpression/stepThrough");
var Symbols = require("../Symbols");
var COMPARATOR_TO_FUNCTION = {
    '=': function (left, right) { return left === right; },
    '>': function (left, right) { return left > right; },
    '>=': function (left, right) { return left >= right; },
    '<': function (left, right) { return left < right; },
    '<=': function (left, right) { return left <= right; },
};
// Given a leftNode, rightNode and a comparator, will return the steps to get
// the solution. Possible solutions include:
// - solving for a variable (e.g. 'x=3' for '3x=4+5')
// - the result of comparing values (e.g. 'true' for 3 = 3, 'false' for 3 < 2)
function stepThrough(leftNode, rightNode, comparator, debug) {
    if (debug === void 0) { debug = false; }
    var equation = new Equation(leftNode, rightNode, comparator);
    if (debug) {
        // eslint-disable-next-line
        // unsure whether or not the second paramter should be a thing?
        console.log('\n\nSolving: ' + equation.print(false));
    }
    // we can't solve/find steps if there are any unsupported nodes
    if (checks.hasUnsupportedNodes(equation.leftNode) ||
        checks.hasUnsupportedNodes(equation.rightNode)) {
        return [];
    }
    var symbolSet = Symbols.getSymbolsInEquation(equation);
    if (symbolSet.size === 0) {
        return solveConstantEquation(equation, debug);
    }
    var symbolName = symbolSet.values().next().value;
    var equationStatus;
    var steps = [];
    var originalEquationStr = equation.print();
    var MAX_STEP_COUNT = 20;
    var iters = 0;
    // Step through the math equation until nothing changes
    do {
        steps = addSimplificationSteps(steps, equation, debug);
        if (steps.length > 0) {
            var lastStep = steps[steps.length - 1];
            equation = Equation.createEquationFromString(lastStep.newEquation.print(), equation.comparator);
        }
        equation.leftNode = flattenOperands(equation.leftNode);
        equation.rightNode = flattenOperands(equation.rightNode);
        // at this point, the symbols might have cancelled out.
        if (Symbols.getSymbolsInEquation(equation).size === 0) {
            return solveConstantEquation(equation, debug, steps);
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
                    originalEquationStr + '. It reached over 300 characters ' +
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
// Given an equation of constants, will simplify both sides, returning
// the steps and the result of the equation e.g. 'True' or 'False'
function solveConstantEquation(equation, debug, steps) {
    if (steps === void 0) { steps = []; }
    var compareFunction = COMPARATOR_TO_FUNCTION[equation.comparator];
    if (!compareFunction) {
        throw Error('Unexpected comparator');
    }
    steps = addSimplificationSteps(steps, equation, debug);
    if (steps.length > 0) {
        var lastStep = steps[steps.length - 1];
        equation = Equation.createEquationFromString(lastStep.newEquation.print(), equation.comparator);
    }
    // If the left or right side didn't have any steps, unnecessary parens
    // might not have been removed, so do that now.
    equation.leftNode = removeUnnecessaryParens(equation.leftNode);
    equation.rightNode = removeUnnecessaryParens(equation.rightNode);
    if (!mathNode.Type.isConstantOrConstantFraction(equation.leftNode, true) ||
        !mathNode.Type.isConstantOrConstantFraction(equation.rightNode, true)) {
        throw Error('Expected both nodes to be constants, instead got: ' +
            equation.print());
    }
    var leftValue = evaluate(equation.leftNode);
    var rightValue = evaluate(equation.rightNode);
    var changeType;
    if (compareFunction(leftValue, rightValue)) {
        changeType = ChangeTypes.STATEMENT_IS_TRUE;
    }
    else {
        changeType = ChangeTypes.STATEMENT_IS_FALSE;
    }
    // there's no oldEquation or change groups because nothing actually changes
    // here, it's just a final step that states the solution
    var equationStatus = new EquationStatus(changeType, null, equation);
    if (debug) {
        logSteps(equationStatus);
    }
    steps.push(equationStatus);
    return steps;
}
function step(equation, symbolName) {
    var solveFunctions = [
        // ensure the symbol is always on the left node
        EquationOperations.ensureSymbolInLeftNode,
        // get rid of denominators that have the symbol
        EquationOperations.removeSymbolFromDenominator,
        // remove the symbol from the right side
        EquationOperations.removeSymbolFromRightSide,
        // isolate the symbol on the left side
        EquationOperations.isolateSymbolOnLeftSide,
    ];
    for (var i = 0; i < solveFunctions.length; i++) {
        var equationStatus = solveFunctions[i](equation, symbolName);
        if (equationStatus.hasChanged()) {
            return equationStatus;
        }
    }
    return EquationStatus.noChange(equation);
}
// Simplifies the equation and returns the simplification steps
function addSimplificationSteps(steps, equation, debug) {
    if (debug === void 0) { debug = false; }
    var oldEquation = equation.clone();
    var leftSteps = simplifyExpressionNode(equation.leftNode, false);
    var leftSubSteps = [];
    for (var i = 0; i < leftSteps.length; i++) {
        var step_1 = leftSteps[i];
        leftSubSteps.push(EquationStatus.addLeftStep(equation, step_1));
    }
    if (leftSubSteps.length === 1) {
        var step_2 = leftSubSteps[0];
        if (debug) {
            logSteps(step_2);
        }
        steps.push(step_2);
    }
    else if (leftSubSteps.length > 1) {
        var lastStep = leftSubSteps[leftSubSteps.length - 1];
        var finalEquation = EquationStatus.resetChangeGroups(lastStep.newEquation);
        // no change groups are set here - too much is changing for it to be useful
        var simplifyStatus = new EquationStatus(ChangeTypes.SIMPLIFY_LEFT_SIDE, oldEquation, finalEquation, leftSubSteps);
        if (debug) {
            logSteps(simplifyStatus);
        }
        steps.push(simplifyStatus);
    }
    // update `equation` to have the new simplified left node
    if (steps.length > 0) {
        equation = EquationStatus.resetChangeGroups(steps[steps.length - 1].newEquation);
    }
    // the updated equation from simplifing the left side is the old equation
    // (ie the "before" of the before and after) for simplifying the right side.
    oldEquation = equation.clone();
    var rightSteps = simplifyExpressionNode(equation.rightNode, false);
    var rightSubSteps = [];
    for (var i = 0; i < rightSteps.length; i++) {
        var step_3 = rightSteps[i];
        rightSubSteps.push(EquationStatus.addRightStep(equation, step_3));
    }
    if (rightSubSteps.length === 1) {
        var step_4 = rightSubSteps[0];
        if (debug) {
            logSteps(step_4);
        }
        steps.push(step_4);
    }
    else if (rightSubSteps.length > 1) {
        var lastStep = rightSubSteps[rightSubSteps.length - 1];
        var finalEquation = EquationStatus.resetChangeGroups(lastStep.newEquation);
        // no change groups are set here - too much is changing for it to be useful
        var simplifyStatus = new EquationStatus(ChangeTypes.SIMPLIFY_RIGHT_SIDE, oldEquation, finalEquation, rightSubSteps);
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
//# sourceMappingURL=stepThrough.js.map