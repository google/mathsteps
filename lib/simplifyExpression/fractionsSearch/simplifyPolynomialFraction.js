"use strict";
var arithmeticSearch = require("../arithmeticSearch");
var clone = require("../../util/clone");
var divideByGCD = require("./divideByGCD");
var mathNode = require("../../mathnode");
// Simplifies a polynomial term with a fraction as its coefficients.
// e.g. 2x/4 --> x/2    10x/5 --> 2x
// Also simplified negative signs
// e.g. -y/-3 --> y/3   4x/-5 --> -4x/5
// returns the new simplified node in a mathNode.Status object
function simplifyPolynomialFraction(node) {
    if (!mathNode.PolynomialTerm.isPolynomialTerm(node)) {
        return mathNode.Status.noChange(node);
    }
    var polyNode = new mathNode.PolynomialTerm(clone(node));
    if (!polyNode.hasFractionCoeff()) {
        return mathNode.Status.noChange(node);
    }
    var coefficientSimplifications = [
        divideByGCD,
        arithmeticSearch,
    ];
    for (var i = 0; i < coefficientSimplifications.length; i++) {
        var coefficientFraction = polyNode.getCoeffNode(); // a division node
        var newCoeffStatus = coefficientSimplifications[i](coefficientFraction);
        if (newCoeffStatus.hasChanged()) {
            var newCoeff = newCoeffStatus.newNode;
            if (newCoeff.value === "1") {
                newCoeff = null;
            }
            var exponentNode = polyNode.getExponentNode();
            var newNode = mathNode.Creator.polynomialTerm(polyNode.getSymbolNode(), exponentNode, newCoeff);
            return mathNode.Status.nodeChanged(newCoeffStatus.changeType, node, newNode);
        }
    }
    return mathNode.Status.noChange(node);
}
module.exports = simplifyPolynomialFraction;
//# sourceMappingURL=simplifyPolynomialFraction.js.map