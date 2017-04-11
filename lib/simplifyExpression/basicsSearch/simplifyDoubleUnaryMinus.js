"use strict";
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node) {
    if (!mathNode.Type.isUnaryMinus(node)) {
        return mathNode.Status.noChange(node);
    }
    var unaryArg = node.args[0];
    // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
    if (mathNode.Type.isUnaryMinus(unaryArg)) {
        var newNode = clone(unaryArg.args[0]);
        return mathNode.Status.nodeChanged(ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
    }
    else if (mathNode.Type.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
        var newNode = mathNode.Creator.constant(parseFloat(unaryArg.value) * -1);
        return mathNode.Status.nodeChanged(ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
    }
    else if (mathNode.Type.isParenthesis(unaryArg)) {
        var parenthesisNode = unaryArg;
        var parenthesisContent = parenthesisNode;
        if (mathNode.Type.isUnaryMinus(parenthesisContent)) {
            var newNode = mathNode.Creator.parenthesis(parenthesisContent.args[0]);
            return mathNode.Status.nodeChanged(ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
        }
    }
    return mathNode.Status.noChange(node);
}
module.exports = simplifyDoubleUnaryMinus;
//# sourceMappingURL=simplifyDoubleUnaryMinus.js.map