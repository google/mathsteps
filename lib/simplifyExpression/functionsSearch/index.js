"use strict";
var absoluteValue = require("./absoluteValue");
var nthRoot = require("./nthRoot");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
var FUNCTIONS = [
    nthRoot,
    absoluteValue
];
// Searches through the tree, prioritizing deeper nodes, and evaluates
// functions (e.g. abs(-4)) if possible.
// Returns a mathNode.Status object.
var search = TreeSearch.postOrder(functions);
// Evaluates a function call if possible. Returns a mathNode.Status object.
function functions(node) {
    if (!mathNode.Type.isFunction(node)) {
        return mathNode.Status.noChange(node);
    }
    for (var i = 0; i < FUNCTIONS.length; i++) {
        var nodeStatus = FUNCTIONS[i](node);
        if (nodeStatus.hasChanged()) {
            return nodeStatus;
        }
    }
    return mathNode.Status.noChange(node);
}
module.exports = search;
//# sourceMappingURL=index.js.map