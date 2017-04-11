"use strict";
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a mathNode.Status object.
function removeExponentByOne(node) {
    if (node.op === "^" &&
        mathNode.Type.isConstant(node.args[1]) &&
        node.args[1].value === "1") {
        var newNode = clone(node.args[0]);
        return mathNode.Status.nodeChanged(ChangeTypes.REMOVE_EXPONENT_BY_ONE, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
module.exports = removeExponentByOne;
//# sourceMappingURL=removeExponentByOne.js.map