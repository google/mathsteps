"use strict";
var mathNode = require("../mathnode");
// Returns true if the nodes are polynomial terms that can be added together.
function canAddLikeTermPolynomialNodes(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== "+") {
        return false;
    }
    var args = node.args;
    if (!args.every(function (n) { return mathNode.PolynomialTerm.isPolynomialTerm(n); })) {
        return false;
    }
    if (args.length === 1) {
        return false;
    }
    var polynomialTermList = args.map(function (n) { return new mathNode.PolynomialTerm(n); });
    // to add terms, they must have the same symbol name *and* exponent
    var firstTerm = polynomialTermList[0];
    var sharedSymbol = firstTerm.getSymbolName();
    var sharedExponentNode = firstTerm.getExponentNode(true);
    var restTerms = polynomialTermList.slice(1);
    return restTerms.every(function (term) {
        var haveSameSymbol = sharedSymbol === term.getSymbolName();
        var exponentNode = term.getExponentNode(true);
        var haveSameExponent = exponentNode.equals(sharedExponentNode);
        return haveSameSymbol && haveSameExponent;
    });
}
module.exports = canAddLikeTermPolynomialNodes;
//# sourceMappingURL=canAddLikeTermPolynomialNodes.js.map