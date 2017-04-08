"use strict";
var ChangeTypes = require("../../ChangeTypes");
var evaluate = require("../../util/evaluate");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
// Searches through the tree, prioritizing deeper nodes, and evaluates
// arithmetic (e.g. 2+2 or 3*5*2) on an operation node if possible.
// Returns a mathNode.Status object.
var search = TreeSearch.postOrder(arithmetic);
// evaluates arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
// Returns a mathNode.Status object.
function arithmetic(node) {
    if (!mathNode.Type.isOperator(node)) {
        return mathNode.Status.noChange(node);
    }
    if (!node.args.every(function (child) { return mathNode.Type.isConstant(child, true); })) {
        return mathNode.Status.noChange(node);
    }
    // we want to eval each arg so unary minuses around constant nodes become
    // constant nodes with negative values
    node.args.forEach(function (arg, i) {
        node.args[i] = mathNode.Creator.constant(evaluate(arg));
    });
    // Only resolve division of integers if we get an integer result.
    // Note that a fraction of decimals will be divided out.
    if (mathNode.Type.isIntegerFraction(node)) {
        var numeratorValue = parseInt(node.args[0]);
        var denominatorValue = parseInt(node.args[1]);
        if (numeratorValue % denominatorValue === 0) {
            var newNode = mathNode.Creator.constant(numeratorValue / denominatorValue);
            return mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode);
        }
        else {
            return mathNode.Status.noChange(node);
        }
    }
    else {
        var evaluatedValue = evaluateAndRound(node);
        var newNode = mathNode.Creator.constant(evaluatedValue);
        return mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode);
    }
}
// Evaluates a math expression to a constant, e.g. 3+4 -> 7 and rounds if
// necessary
function evaluateAndRound(node) {
    var result = evaluate(node);
    if (result < 1) {
        result = parseFloat(result.toPrecision(4));
    }
    else {
        result = parseFloat(result.toFixed(4));
    }
    return result;
}
module.exports = search;
//# sourceMappingURL=index.js.map