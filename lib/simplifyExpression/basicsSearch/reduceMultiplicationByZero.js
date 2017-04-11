"use strict";
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
function reduceMultiplicationByZero(node) {
    if (node.op !== "*") {
        return mathNode.Status.noChange(node);
    }
    var zeroIndex = node.args.findIndex(function (arg) {
        if (mathNode.Type.isConstant(arg) && arg.value === "0") {
            return true;
        }
        if (mathNode.PolynomialTerm.isPolynomialTerm(arg)) {
            var polyTerm = new mathNode.PolynomialTerm(arg);
            return polyTerm.getCoeffValue() === 0;
        }
        return false;
    });
    if (zeroIndex >= 0) {
        // reduce to just the 0 node
        var newNode = mathNode.Creator.constant(0);
        return mathNode.Status.nodeChanged(ChangeTypes.MULTIPLY_BY_ZERO, node, newNode);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
module.exports = reduceMultiplicationByZero;
//# sourceMappingURL=reduceMultiplicationByZero.js.map