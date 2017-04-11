"use strict";
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// If `node` is a multiplication node with 1 as one of its operands,
// remove 1 from the operands list. Returns a mathNode.Status object.
function removeMultiplicationByOne(node) {
    if (node.op !== "*") {
        return mathNode.Status.noChange(node);
    }
    var oneIndex = node.args.findIndex(function (arg) {
        return mathNode.Type.isConstant(arg) && arg.value === "1";
    });
    if (oneIndex >= 0) {
        var newNode = clone(node);
        // remove the 1 node
        newNode.args.splice(oneIndex, 1);
        // if there's only one operand left, there's nothing left to multiply it
        // to, so move it up the tree
        if (newNode.args.length === 1) {
            newNode = newNode.args[0];
        }
        return mathNode.Status.nodeChanged(ChangeTypes.REMOVE_MULTIPLYING_BY_ONE, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
module.exports = removeMultiplicationByOne;
//# sourceMappingURL=removeMultiplicationByOne.js.map