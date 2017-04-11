// Operations on equation nodes
"use strict";
var ChangeTypes = require("../ChangeTypes");
var clone = require("../util/clone");
var Equation = require("../equation/Equation");
var EquationStatus = require("../equation/Status");
var Negative = require("../Negative");
var mathNode = require("../mathNode");
var Symbols = require("../Symbols");
var comparatorToInverse = {
    '>': "<",
    '>=': "<=",
    '<': ">",
    '<=': ">=",
    '=': "="
};
var EquationOperations = (function () {
    function EquationOperations() {
    }
    return EquationOperations;
}());
// Ensures that the given equation has the given symbolName on the left side,
// by swapping the right and left sides if it is only in the right side.
// So 3 = x would become x = 3.
EquationOperations.ensureSymbolInLeftNode = function (equation, symbolName) {
    var leftSideSymbolTerm = Symbols.getLastSymbolTerm(equation.leftNode, symbolName);
    var rightSideSymbolTerm = Symbols.getLastSymbolTerm(equation.rightNode, symbolName);
    if (!leftSideSymbolTerm) {
        if (rightSideSymbolTerm) {
            var comparator = comparatorToInverse[equation.comparator];
            var oldEquation = equation;
            var newEquation = new Equation(equation.rightNode, equation.leftNode, comparator);
            // no change groups are set for this step because everything changes, so
            // they wouldn't be pedagogically helpful.
            return new EquationStatus(ChangeTypes.SWAP_SIDES, oldEquation, newEquation);
        }
        else {
            throw Error("No term with symbol: " + symbolName);
        }
    }
    return EquationStatus.noChange(equation);
};
// TODO: Ensures that a symbol is not in the denominator by multiplying
// both sides by the whatever order of the symbol necessary.
// This is blocked on the simplifying functionality of canceling symbols in
// fractions (needs factoring for full canceling support)
EquationOperations.removeSymbolFromDenominator = function (equation) { return EquationStatus.noChange(equation); };
// Removes the given symbolName from the right side by adding or subtracting
// it from both sides as appropriate.
// e.g. 2x = 3x + 5 --> 2x - 3x = 5
// There are actually no cases where we'd remove symbols from the right side
// by multiplying or dividing by a symbol term.
// TODO: support inverting functions e.g. sqrt, ^, log etc.
EquationOperations.removeSymbolFromRightSide = function (equation, symbolName) {
    var rightNode = equation.rightNode;
    var symbolTerm = Symbols.getLastSymbolTerm(rightNode, symbolName);
    var inverseOp, inverseTerm, changeType;
    if (!symbolTerm) {
        return EquationStatus.noChange(equation);
    }
    // Clone it so that any operations on it don't affect the node already
    // in the equation
    symbolTerm = clone(symbolTerm);
    if (mathNode.PolynomialTerm.isPolynomialTerm(rightNode)) {
        if (Negative.isNegative(symbolTerm)) {
            inverseOp = "+";
            changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
            inverseTerm = Negative.negate(symbolTerm);
        }
        else {
            inverseOp = "-";
            changeType = ChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
            inverseTerm = symbolTerm;
        }
    }
    else if (mathNode.Type.isOperator(rightNode)) {
        if (rightNode.op === "+") {
            if (Negative.isNegative(symbolTerm)) {
                inverseOp = "+";
                changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
                inverseTerm = Negative.negate(symbolTerm);
            }
            else {
                inverseOp = "-";
                changeType = ChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
                inverseTerm = symbolTerm;
            }
        }
        else {
            // Note that operator '-' won't show up here because subtraction is
            // flattened into adding the negative. See 'TRICKY catch' in the README
            // for more details.
            throw Error("Unsupported operation: " + symbolTerm.op);
        }
    }
    else if (mathNode.Type.isUnaryMinus(rightNode)) {
        inverseOp = "+";
        changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
        inverseTerm = symbolTerm.args[0];
    }
    else {
        throw Error("Unsupported node type: " + rightNode.type);
    }
    return performTermOperationOnEquation(equation, inverseOp, inverseTerm, changeType);
};
// Isolates the given symbolName to the left side by adding, multiplying, subtracting
// or dividing all other symbols and constants from both sides appropriately
// TODO: support inverting functions e.g. sqrt, ^, log etc.
EquationOperations.isolateSymbolOnLeftSide = function (equation, symbolName) {
    var leftNode = equation.leftNode;
    var nonSymbolTerm = Symbols.getLastNonSymbolTerm(leftNode, symbolName);
    var inverseOp, inverseTerm, changeType;
    if (!nonSymbolTerm) {
        return EquationStatus.noChange(equation);
    }
    // Clone it so that any operations on it don't affect the node already
    // in the equation
    nonSymbolTerm = clone(nonSymbolTerm);
    if (mathNode.Type.isOperator(leftNode)) {
        if (leftNode.op === "+") {
            if (Negative.isNegative(nonSymbolTerm)) {
                inverseOp = "+";
                changeType = ChangeTypes.ADD_TO_BOTH_SIDES;
                inverseTerm = Negative.negate(nonSymbolTerm);
            }
            else {
                inverseOp = "-";
                changeType = ChangeTypes.SUBTRACT_FROM_BOTH_SIDES;
                inverseTerm = nonSymbolTerm;
            }
        }
        else if (leftNode.op === "*") {
            if (mathNode.Type.isConstantFraction(nonSymbolTerm)) {
                inverseOp = "*";
                changeType = ChangeTypes.MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION;
                inverseTerm = mathNode.Creator.operator("/", [nonSymbolTerm.args[1], nonSymbolTerm.args[0]]);
            }
            else {
                inverseOp = "/";
                changeType = ChangeTypes.DIVIDE_FROM_BOTH_SIDES;
                inverseTerm = nonSymbolTerm;
            }
        }
        else if (leftNode.op === "/") {
            // The non symbol term is always a fraction because it's the
            // coefficient of our symbol term.
            // If the numerator is 1, we multiply both sides by the denominator,
            // otherwise we multiply by the inverse
            if (["1", "-1"].indexOf(nonSymbolTerm.args[0].value) !== -1) {
                inverseOp = "*";
                changeType = ChangeTypes.MULTIPLY_TO_BOTH_SIDES;
                inverseTerm = nonSymbolTerm.args[1];
            }
            else {
                inverseOp = "*";
                changeType = ChangeTypes.MULTIPLY_BOTH_SIDES_BY_INVERSE_FRACTION;
                inverseTerm = mathNode.Creator.operator("/", [nonSymbolTerm.args[1], nonSymbolTerm.args[0]]);
            }
        }
        else if (leftNode.op === "^") {
            // TODO: support roots
            return EquationStatus.noChange(equation);
        }
        else {
            throw Error("Unsupported operation: " + leftNode.op);
        }
    }
    else if (mathNode.Type.isUnaryMinus(leftNode)) {
        inverseOp = "*";
        changeType = ChangeTypes.MULTIPLY_BOTH_SIDES_BY_NEGATIVE_ONE;
        inverseTerm = mathNode.Creator.constant(-1);
    }
    else {
        throw Error("Unsupported node type: " + leftNode.type);
    }
    return performTermOperationOnEquation(equation, inverseOp, inverseTerm, changeType);
};
// Modifies the left and right sides of an equation by `op`-ing `term`
// to both sides. Returns an Status object.
function performTermOperationOnEquation(equation, op, term, changeType) {
    var oldEquation = equation.clone();
    var leftTerm = clone(term);
    var rightTerm = clone(term);
    var leftNode = performTermOperationOnExpression(equation.leftNode, op, leftTerm);
    var rightNode = performTermOperationOnExpression(equation.rightNode, op, rightTerm);
    var comparator = equation.comparator;
    if (Negative.isNegative(term) && (op === "*" || op === "/")) {
        comparator = comparatorToInverse[comparator];
    }
    var newEquation = new Equation(leftNode, rightNode, comparator);
    return new EquationStatus(changeType, oldEquation, newEquation);
}
// Performs an operation of a term on an entire given expression
function performTermOperationOnExpression(expression, op, term) {
    var node = (mathNode.Type.isOperator(expression) ?
        mathNode.Creator.parenthesis(expression) : expression);
    term.changeGroup = 1;
    var newNode = mathNode.Creator.operator(op, [node, term]);
    return newNode;
}
module.exports = EquationOperations;
//# sourceMappingURL=EquationOperations.js.map