"use strict";
var checks = require("../../checks");
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a mathNode.Status object.
function removeExponentBaseOne(node) {
    if (node.op === "^" &&
        checks.resolvesToConstant(node.args[1]) &&
        mathNode.Type.isConstant(node.args[0]) &&
        node.args[0].value === "1") {
        var newNode = clone(node.args[0]);
        return mathNode.Status.nodeChanged(ChangeTypes.REMOVE_EXPONENT_BASE_ONE, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
module.exports = removeExponentBaseOne;
//# sourceMappingURL=removeExponentBaseOne.js.map