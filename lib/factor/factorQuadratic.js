"use strict";
/// <reference path="../../node_modules/@types/mathjs/index.d.ts"/>
var math = require("mathjs");
var ConstantFactors = require("./ConstantFactors");
var ChangeTypes = require("../ChangeTypes");
var checks = require("../checks");
var evaluate = require("../util/evaluate");
var flatten = require("../util/flattenOperands");
var Negative = require("../Negative");
var mathNode = require("../mathNode");
var factorFunctions = [
    // factor just the symbol e.g. x^2 + 2x -> x(x + 2)
    factorSymbol,
    // factor difference of squares e.g. x^2 - 4
    factorDifferenceOfSquares,
    // factor perfect square e.g. x^2 + 2x + 1
    factorPerfectSquare,
    // factor sum product rule e.g. x^2 + 3x + 2
    factorSumProductRule
];
// Given a node, will check if it's in the form of a quadratic equation
// `ax^2 + bx + c`, and
// if it is, will factor it using one of the following rules:
//    - Factor out the symbol e.g. x^2 + 2x -> x(x + 2)
//    - Difference of squares e.g. x^2 - 4 -> (x+2)(x-2)
//    - Perfect square e.g. x^2 + 2x + 1 -> (x+1)^2
//    - Sum/product rule e.g. x^2 + 3x + 2 -> (x+1)(x+2)
//    - TODO: quadratic formula
//        requires us simplify the following only within the parens:
//        a(x - (-b + sqrt(b^2 - 4ac)) / 2a)(x - (-b - sqrt(b^2 - 4ac)) / 2a)
function factorQuadratic(node) {
    node = flatten(node);
    if (!checks.isQuadratic(node)) {
        return mathNode.Status.noChange(node);
    }
    // get a, b and c
    var symbol, aValue = 0, bValue = 0, cValue = 0;
    for (var _i = 0, _a = node.args; _i < _a.length; _i++) {
        var term = _a[_i];
        if (mathNode.Type.isConstant(term)) {
            cValue = evaluate(term);
        }
        else if (mathNode.PolynomialTerm.isPolynomialTerm(term)) {
            var polyTerm = new mathNode.PolynomialTerm(term);
            var exponent = polyTerm.getExponentNode(true);
            if (exponent.value === "2") {
                symbol = polyTerm.getSymbolNode();
                aValue = polyTerm.getCoeffValue();
            }
            else if (exponent.value === "1") {
                bValue = polyTerm.getCoeffValue();
            }
            else {
                return mathNode.Status.noChange(node);
            }
        }
        else {
            return mathNode.Status.noChange(node);
        }
    }
    if (!symbol || !aValue) {
        return mathNode.Status.noChange(node);
    }
    var negate = false;
    if (aValue < 0) {
        negate = true;
        aValue = -aValue;
        bValue = -bValue;
        cValue = -cValue;
    }
    for (var i = 0; i < factorFunctions.length; i++) {
        var nodeStatus = factorFunctions[i](node, symbol, aValue, bValue, cValue, negate);
        if (nodeStatus.hasChanged()) {
            return nodeStatus;
        }
    }
    return mathNode.Status.noChange(node);
}
// Will factor the node if it's in the form of ax^2 + bx
function factorSymbol(node, symbol, aValue, bValue, cValue, negate) {
    if (!bValue || cValue) {
        return mathNode.Status.noChange(node);
    }
    var gcd = math.gcd(aValue, bValue);
    var gcdNode = mathNode.Creator.constant(gcd);
    var aNode = mathNode.Creator.constant(aValue / gcd);
    var bNode = mathNode.Creator.constant(bValue / gcd);
    var factoredNode = mathNode.Creator.polynomialTerm(symbol, null, gcdNode);
    var polyTerm = mathNode.Creator.polynomialTerm(symbol, null, aNode);
    var paren = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", [polyTerm, bNode]));
    var newNode = mathNode.Creator.operator("*", [factoredNode, paren], true);
    if (negate) {
        newNode = Negative.negate(newNode);
    }
    return mathNode.Status.nodeChanged(ChangeTypes.FACTOR_SYMBOL, node, newNode);
}
// Will factor the node if it's in the form of ax^2 - c, and the aValue
// and cValue are perfect squares
// e.g. 4x^2 - 4 -> (2x + 2)(2x - 2)
function factorDifferenceOfSquares(node, symbol, aValue, bValue, cValue, negate) {
    // check if difference of squares: (i) abs(a) and abs(c) are squares, (ii) b = 0,
    // (iii) c is negative
    if (bValue || !cValue) {
        return mathNode.Status.noChange(node);
    }
    var aRootValue = Math.sqrt(Math.abs(aValue));
    var cRootValue = Math.sqrt(Math.abs(cValue));
    // must be a difference of squares
    if ((aRootValue % 1 === 0) &&
        (cRootValue % 1 === 0) &&
        cValue < 0) {
        var aRootNode = mathNode.Creator.constant(aRootValue);
        var cRootNode = mathNode.Creator.constant(cRootValue);
        var polyTerm = mathNode.Creator.polynomialTerm(symbol, null, aRootNode);
        var firstParen = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", [polyTerm, cRootNode]));
        var secondParen = mathNode.Creator.parenthesis(mathNode.Creator.operator("-", [polyTerm, cRootNode]));
        // create node in difference of squares form
        var newNode = mathNode.Creator.operator("*", [firstParen, secondParen], true);
        if (negate) {
            newNode = Negative.negate(newNode);
        }
        return mathNode.Status.nodeChanged(ChangeTypes.FACTOR_DIFFERENCE_OF_SQUARES, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
// Will factor the node if it's in the form of ax^2 + bx + c, where a and c
// are perfect squares and b = 2*sqrt(a)*sqrt(c)
// e.g. x^2 + 2x + 1 -> (x + 1)^2
function factorPerfectSquare(node, symbol, aValue, bValue, cValue, negate) {
    // check if perfect square: (i) a and c squares, (ii) b = 2*sqrt(a)*sqrt(c)
    if (!bValue || !cValue) {
        return mathNode.Status.noChange(node);
    }
    var aRootValue = Math.sqrt(Math.abs(aValue));
    var cRootValue = Math.sqrt(Math.abs(cValue));
    // if the second term is negative, then the constant in the parens is
    // subtracted: e.g. x^2 - 2x + 1 -> (x - 1)^2
    if (bValue < 0) {
        cRootValue = cRootValue * -1;
    }
    // apply the perfect square test
    var perfectProduct = 2 * aRootValue * cRootValue;
    if ((aRootValue % 1 === 0) &&
        (cRootValue % 1 === 0) &&
        bValue === perfectProduct) {
        var aRootNode = mathNode.Creator.constant(aRootValue);
        var cRootNode = mathNode.Creator.constant(cRootValue);
        var polyTerm = mathNode.Creator.polynomialTerm(symbol, null, aRootNode);
        var paren = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", [polyTerm, cRootNode]));
        var exponent = mathNode.Creator.constant(2);
        // create node in perfect square form
        var newNode = mathNode.Creator.operator("^", [paren, exponent]);
        if (negate) {
            newNode = Negative.negate(newNode);
        }
        return mathNode.Status.nodeChanged(ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
// Will factor the node if it's in the form of x^2 + bx + c (i.e. a is 1), by
// applying the sum product rule: finding factors of c that add up to b.
// e.g. x^2 + 3x + 2 -> (x + 1)(x + 2)
function factorSumProductRule(node, symbol, aValue, bValue, cValue, negate) {
    if (aValue === 1 && bValue && cValue) {
        // try sum/product rule: find a factor pair of c that adds up to b
        var factorPairs = ConstantFactors.getFactorPairs(cValue);
        for (var _i = 0, factorPairs_1 = factorPairs; _i < factorPairs_1.length; _i++) {
            var pair = factorPairs_1[_i];
            if (pair[0] + pair[1] === bValue) {
                var firstParen = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", [symbol, mathNode.Creator.constant(pair[0])]));
                var secondParen = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", [symbol, mathNode.Creator.constant(pair[1])]));
                // create a node in the general factored form for expression
                var newNode = mathNode.Creator.operator("*", [firstParen, secondParen], true);
                if (negate) {
                    newNode = Negative.negate(newNode);
                }
                return mathNode.Status.nodeChanged(ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
            }
        }
    }
    return mathNode.Status.noChange(node);
}
module.exports = factorQuadratic;
//# sourceMappingURL=factorQuadratic.js.map