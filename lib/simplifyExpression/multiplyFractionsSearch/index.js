"use strict";
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// TODO: add a step somewhere to remove common terms in numerator and
// denominator (so the 5s would cancel out on the next step after this)
// This step must happen after things have been distributed, or else the answer
// will be formatted badly, so it's a tree search of its own.
// Returns a mathNode.Status object.
var search = TreeSearch.postOrder(multiplyFractions);
function multiplyFractions(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== '*') {
        return mathNode.Status.noChange(node);
    }
    var atLeastOneFraction = node.args.some(function (arg) { return mathNode.Type.isOperator(arg, '/'); });
    var hasPolynomialTerms = node.args.some(function (arg) { return mathNode.PolynomialTerm.isPolynomialTerm(arg); });
    if (!atLeastOneFraction || hasPolynomialTerms) {
        return mathNode.Status.noChange(node);
    }
    var numeratorArgs = [];
    var denominatorArgs = [];
    node.args.forEach(function (operand) {
        if (mathNode.Type.isOperator(operand, '/')) {
            numeratorArgs.push(operand.args[0]);
            denominatorArgs.push(operand.args[1]);
        }
        else {
            numeratorArgs.push(operand);
        }
    });
    var newNumerator = mathNode.Creator.parenthesis(mathNode.Creator.operator('*', numeratorArgs));
    var newDenominator = denominatorArgs.length === 1
        ? denominatorArgs[0]
        : mathNode.Creator.parenthesis(mathNode.Creator.operator('*', denominatorArgs));
    var newNode = mathNode.Creator.operator('/', [newNumerator, newDenominator]);
    return mathNode.Status.nodeChanged(ChangeTypes.MULTIPLY_FRACTIONS, node, newNode);
}
module.exports = search;
//# sourceMappingURL=index.js.map