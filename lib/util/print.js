"use strict";
var clone = require("./clone");
var flatten = require("./flattenOperands");
var mathNode = require("../mathNode");
// Prints an expression node in asciimath
// If showPlusMinus is true, print + - (e.g. 2 + -3)
// If it's false (the default) 2 + -3 would print as 2 - 3
// (The + - is needed to support the conversion of subtraction to addition of
// negative terms. See flattenOperands for more details if you're curious.)
function print(node, showPlusMinus) {
    if (showPlusMinus === void 0) { showPlusMinus = false; }
    node = flatten(clone(node));
    var string = printTreeTraversal(node);
    if (!showPlusMinus) {
        string = string.replace(/\s*?\+\s*?\-\s*?/g, " - ");
    }
    return string;
}
function printTreeTraversal(node, parentNode) {
    if (mathNode.PolynomialTerm.isPolynomialTerm(node)) {
        var polyTerm = new mathNode.PolynomialTerm(node);
        // This is so we don't print 2/3 x^2 as 2 / 3x^2
        // Still print x/2 as x/2 and not 1/2 x though
        if (polyTerm.hasFractionCoeff() && node.op !== "/") {
            var coeffTerm = polyTerm.getCoeffNode();
            var coeffStr = printTreeTraversal(coeffTerm);
            var nonCoeffTerm = mathNode.Creator.polynomialTerm(polyTerm.symbol, polyTerm.exponent, null);
            var nonCoeffStr = printTreeTraversal(nonCoeffTerm);
            return coeffStr + " " + nonCoeffStr;
        }
    }
    if (mathNode.Type.isIntegerFraction(node)) {
        return node.args[0] + "/" + node.args[1];
    }
    if (mathNode.Type.isOperator(node)) {
        if (node.op === "/" && mathNode.Type.isOperator(node.args[1])) {
            return printTreeTraversal(node.args[0]) + " / (" + printTreeTraversal(node.args[1]) + ")";
        }
        var opString = "";
        switch (node.op) {
            case "+":
            case "-":
                // add space between operator and operands
                opString = " " + node.op + " ";
                break;
            case "*":
                if (node.implicit) {
                    break;
                }
                opString = " " + node.op + " ";
                break;
            case "/":
                // no space for constant fraction divisions (slightly easier to read)
                if (mathNode.Type.isConstantFraction(node, true)) {
                    opString = "" + node.op;
                }
                else {
                    opString = " " + node.op + " ";
                }
                break;
            case "^":
                // no space for exponents
                opString = "" + node.op;
                break;
        }
        var str = node.args.map(function (arg) { return printTreeTraversal(arg, node); }).join(opString);
        // Need to add parens around any [+, -] operation
        // nested in [/, *, ^] operation
        // Check #120, #126 issues for more details.
        // { "/" [{ "+" ["x", "2"] }, "2"] } -> (x + 2) / 2.
        if (parentNode &&
            mathNode.Type.isOperator(parentNode) &&
            node.op && parentNode.op &&
            "*/^".indexOf(parentNode.op) >= 0 &&
            "+-".indexOf(node.op) >= 0) {
            str = "(" + str + ")";
        }
        return str;
    }
    else if (mathNode.Type.isParenthesis(node)) {
        return "(" + printTreeTraversal(node.content) + ")";
    }
    else if (mathNode.Type.isUnaryMinus(node)) {
        if (mathNode.Type.isOperator(node.args[0]) &&
            "*/^".indexOf(node.args[0].op) === -1 &&
            !mathNode.PolynomialTerm.isPolynomialTerm(node)) {
            return "-(" + printTreeTraversal(node.args[0]) + ")";
        }
        else {
            return "-" + printTreeTraversal(node.args[0]);
        }
    }
    else {
        return node.toString();
    }
}
module.exports = print;
//# sourceMappingURL=print.js.map