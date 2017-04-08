/*
 * Performs simpifications on fractions: adding and cancelling out.
 *
 * Note: division is represented in mathjs as an operator node with op '/'
 * and two args, where arg[0] is the numerator and arg[1] is the denominator

// This module manipulates fractions with constants in the numerator and
// denominator. For more complex/general fractions, see Fraction.js

 */
"use strict";
var addConstantAndFraction = require("./addConstantAndFraction");
var addConstantFractions = require("./addConstantFractions");
var cancelLikeTerms = require("./cancelLikeTerms");
var divideByGCD = require("./divideByGCD");
var simplifyFractionSigns = require("./simplifyFractionSigns");
var simplifyPolynomialFraction = require("./simplifyPolynomialFraction");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
var SIMPLIFICATION_FUNCTIONS = [
    // e.g. 2/3 + 5/6
    addConstantFractions,
    // e.g. 4 + 5/6 or 4.5 + 6/8
    addConstantAndFraction,
    // e.g. 2/-9  ->  -2/9      e.g. -2/-9  ->  2/9
    simplifyFractionSigns,
    // e.g. 8/12  ->  2/3 (divide by GCD 4)
    divideByGCD,
    // e.g. 2x/4 -> x/2 (divideByGCD but for coefficients of polynomial terms)
    simplifyPolynomialFraction,
    // e.g. (2x * 5) / 2x  ->  5
    cancelLikeTerms,
];
var search = TreeSearch.preOrder(simplifyFractions);
function simplifyFractions(node) {
    for (var i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
        var nodeStatus = SIMPLIFICATION_FUNCTIONS[i](node);
        if (nodeStatus.hasChanged()) {
            return nodeStatus;
        }
        else {
            node = nodeStatus.newNode;
        }
    }
    return mathNode.Status.noChange(node);
}
module.exports = search;
//# sourceMappingURL=index.js.map