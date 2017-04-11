"use strict";
var clone = require("../../util/clone");
var math = require("mathjs");
var ChangeTypes = require("../../ChangeTypes");
var evaluate = require("../../util/evaluate");
var mathNode = require("../../mathnode");
// Evaluates abs() function if it's on a single constant value.
// Returns a mathNode.Status object.
function absoluteValue(node) {
    if (!mathNode.Type.isFunction(node, "abs")) {
        return mathNode.Status.noChange(node);
    }
    if (node.args.length > 1) {
        return mathNode.Status.noChange(node);
    }
    var newNode = clone(node);
    var argument = newNode.args[0];
    if (mathNode.Type.isConstant(argument, true)) {
        newNode = mathNode.Creator.constant(math.abs(evaluate(argument)));
        return mathNode.Status.nodeChanged(ChangeTypes.ABSOLUTE_VALUE, node, newNode);
    }
    else if (mathNode.Type.isConstantFraction(argument, true)) {
        var newNumerator = mathNode.Creator.constant(math.abs(evaluate(argument.args[0])));
        var newDenominator = mathNode.Creator.constant(math.abs(evaluate(argument.args[1])));
        newNode = mathNode.Creator.operator("/", [newNumerator, newDenominator]);
        return mathNode.Status.nodeChanged(ChangeTypes.ABSOLUTE_VALUE, node, newNode);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
module.exports = absoluteValue;
//# sourceMappingURL=absoluteValue.js.map