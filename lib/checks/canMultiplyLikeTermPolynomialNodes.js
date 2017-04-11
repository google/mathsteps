"use strict";
var mathNode = require("../mathnode");
// Returns true if the nodes are symbolic terms with the same symbol and no
// coefficients.
function canMultiplyLikeTermPolynomialNodes(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== "*") {
        return false;
    }
    var args = node.args;
    if (!args.every(function (n) { return mathNode.PolynomialTerm.isPolynomialTerm(n); })) {
        return false;
    }
    if (args.length === 1) {
        return false;
    }
    var polynomialTermList = node.args.map(function (n) { return new mathNode.PolynomialTerm(n); });
    if (!polynomialTermList.every(function (polyTerm) { return !polyTerm.hasCoeff(); })) {
        return false;
    }
    var firstTerm = polynomialTermList[0];
    var restTerms = polynomialTermList.slice(1);
    // they're considered like terms if they have the same symbol name
    return restTerms.every(function (term) { return firstTerm.getSymbolName() === term.getSymbolName(); });
}
module.exports = canMultiplyLikeTermPolynomialNodes;
//# sourceMappingURL=canMultiplyLikeTermPolynomialNodes.js.map