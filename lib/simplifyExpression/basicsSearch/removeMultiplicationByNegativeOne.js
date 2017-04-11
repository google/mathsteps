"use strict";
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var Negative = require("../../Negative");
var mathNode = require("../../mathnode");
function removeMultiplicationByNegativeOne(node) {
    if (node.op !== "*") {
        return mathNode.Status.noChange(node);
    }
    var minusOneIndex = node.args.findIndex(function (arg) {
        return mathNode.Type.isConstant(arg) && arg.value === "-1";
    });
    if (minusOneIndex < 0) {
        return mathNode.Status.noChange(node);
    }
    // We might merge/combine the negative one into another node. This stores
    // the index of that other node in the arg list.
    var nodeToCombineIndex;
    // If minus one is the last term, maybe combine with the term before
    if (minusOneIndex + 1 === node.args.length) {
        nodeToCombineIndex = minusOneIndex - 1;
    }
    else {
        nodeToCombineIndex = minusOneIndex + 1;
    }
    var nodeToCombine = node.args[nodeToCombineIndex];
    // If it's a constant, the combining of those terms is handled elsewhere.
    if (mathNode.Type.isConstant(nodeToCombine)) {
        return mathNode.Status.noChange(node);
    }
    var newNode = clone(node);
    // Get rid of the -1
    nodeToCombine = Negative.negate(clone(nodeToCombine));
    // replace the node next to -1 and remove -1
    newNode.args[nodeToCombineIndex] = nodeToCombine;
    newNode.args.splice(minusOneIndex, 1);
    // if there's only one operand left, move it up the tree
    if (newNode.args.length === 1) {
        newNode = newNode.args[0];
    }
    return mathNode.Status.nodeChanged(ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node, newNode);
}
module.exports = removeMultiplicationByNegativeOne;
//# sourceMappingURL=removeMultiplicationByNegativeOne.js.map