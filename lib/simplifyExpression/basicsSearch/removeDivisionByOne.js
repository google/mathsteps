"use strict";
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var Negative = require("../../Negative");
var mathNode = require("../../mathnode");
// If `node` is a division operation of something by 1 or -1, we can remove the
// denominator. Returns a mathNode.Status object.
function removeDivisionByOne(node) {
    if (node.op !== "/") {
        return mathNode.Status.noChange(node);
    }
    var denominator = node.args[1];
    if (!mathNode.Type.isConstant(denominator)) {
        return mathNode.Status.noChange(node);
    }
    var numerator = clone(node.args[0]);
    // if denominator is -1, we make the numerator negative
    if (parseFloat(denominator.value) === -1) {
        // If the numerator was an operation, wrap it in parens before adding -
        // to the front.
        // e.g. 2+3 / -1 ---> -(2+3)
        if (mathNode.Type.isOperator(numerator)) {
            numerator = mathNode.Creator.parenthesis(numerator);
        }
        var changeType = Negative.isNegative(numerator) ?
            ChangeTypes.RESOLVE_DOUBLE_MINUS :
            ChangeTypes.DIVISION_BY_NEGATIVE_ONE;
        numerator = Negative.negate(numerator);
        return mathNode.Status.nodeChanged(changeType, node, numerator);
    }
    else if (parseFloat(denominator.value) === 1) {
        return mathNode.Status.nodeChanged(ChangeTypes.DIVISION_BY_ONE, node, numerator);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
module.exports = removeDivisionByOne;
//# sourceMappingURL=removeDivisionByOne.js.map