"use strict";
var math = require("mathjs");
var checks = require("../checks");
var flattenOperands = require("../util/flattenOperands");
var print = require("../util/print");
var removeUnnecessaryParens = require("../util/removeUnnecessaryParens");
var stepThrough = require("./stepThrough");
// Given a mathjs expression node, steps through simplifying the expression.
// Returns the simplified expression node.
function simplify(node, debug) {
    if (debug === void 0) { debug = false; }
    if (checks.hasUnsupportedNodes(node)) {
        return node;
    }
    var steps = stepThrough(node, debug);
    var simplifiedNode;
    if (steps.length > 0) {
        simplifiedNode = steps.pop().newNode;
    }
    else {
        // removing parens isn't counted as a step, so try it here
        simplifiedNode = removeUnnecessaryParens(flattenOperands(node), true);
    }
    // unflatten the node.
    return unflatten(simplifiedNode);
}
function unflatten(node) {
    return math.parse(print(node));
}
module.exports = simplify;
//# sourceMappingURL=simplify.js.map