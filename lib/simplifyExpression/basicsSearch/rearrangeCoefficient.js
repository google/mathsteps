"use strict";
var checks = require("../../checks");
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// Rearranges something of the form x * 5 to be 5x, ie putting the coefficient
// in the right place.
// Returns a mathNode.Status object
function rearrangeCoefficient(node) {
    if (!checks.canRearrangeCoefficient(node)) {
        return mathNode.Status.noChange(node);
    }
    var newNode = clone(node);
    var polyNode = new mathNode.PolynomialTerm(newNode.args[0]);
    var constNode = newNode.args[1];
    var exponentNode = polyNode.getExponentNode();
    newNode = mathNode.Creator.polynomialTerm(polyNode.getSymbolNode(), exponentNode, constNode);
    return mathNode.Status.nodeChanged(ChangeTypes.REARRANGE_COEFF, node, newNode);
}
module.exports = rearrangeCoefficient;
//# sourceMappingURL=rearrangeCoefficient.js.map