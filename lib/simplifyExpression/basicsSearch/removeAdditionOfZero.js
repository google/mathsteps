"use strict";
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
function removeAdditionOfZero(node) {
    if (node.op !== "+") {
        return mathNode.Status.noChange(node);
    }
    var zeroIndex = node.args.findIndex(function (arg) {
        return mathNode.Type.isConstant(arg) && arg.value === "0";
    });
    var newNode = clone(node);
    if (zeroIndex >= 0) {
        // remove the 0 node
        newNode.args.splice(zeroIndex, 1);
        // if there's only one operand left, there's nothing left to add it to,
        // so move it up the tree
        if (newNode.args.length === 1) {
            newNode = newNode.args[0];
        }
        return mathNode.Status.nodeChanged(ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
module.exports = removeAdditionOfZero;
//# sourceMappingURL=removeAdditionOfZero.js.map