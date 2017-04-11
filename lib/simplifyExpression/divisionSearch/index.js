"use strict";
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
// Searches for and simplifies any chains of division or nested division.
// Returns a mathNode.Status object
var search = TreeSearch.preOrder(division);
function division(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== "/") {
        return mathNode.Status.noChange(node);
    }
    // e.g. 2/(x/6) => 2 * 6/x
    var nodeStatus = multiplyByInverse(node);
    if (nodeStatus.hasChanged()) {
        return nodeStatus;
    }
    // e.g. 2/x/6 -> 2/(x*6)
    nodeStatus = simplifyDivisionChain(node);
    if (nodeStatus.hasChanged()) {
        return nodeStatus;
    }
    return mathNode.Status.noChange(node);
}
function multiplyByInverse(node) {
    var denominator = node.args[1];
    if (mathNode.Type.isParenthesis(denominator)) {
        denominator = denominator.content;
    }
    if (!mathNode.Type.isOperator(denominator) || denominator.op !== "/") {
        return mathNode.Status.noChange(node);
    }
    // At this point, we know that node is a fraction and denonimator is the
    // fraction we need to inverse.
    var inverseNumerator = denominator.args[1];
    var inverseDenominator = denominator.args[0];
    var inverseFraction = mathNode.Creator.operator("/", [inverseNumerator, inverseDenominator]);
    var newNode = mathNode.Creator.operator("*", [node.args[0], inverseFraction]);
    return mathNode.Status.nodeChanged(ChangeTypes.MULTIPLY_BY_INVERSE, node, newNode);
}
function simplifyDivisionChain(node) {
    // check for a chain of division
    var denominatorList = getDenominatorList(node);
    // one for the numerator, and at least two terms in the denominator
    if (denominatorList.length > 2) {
        var numerator = denominatorList.shift();
        // the new single denominator is all the chained denominators
        // multiplied together, in parentheses.
        var denominator = mathNode.Creator.parenthesis(mathNode.Creator.operator("*", denominatorList));
        var newNode = mathNode.Creator.operator("/", [numerator, denominator]);
        return mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_DIVISION, node, newNode);
    }
    return mathNode.Status.noChange(node);
}
function getDenominatorList(denominator) {
    var node = denominator;
    var denominatorList = [];
    while (node.op === "/") {
        // unshift the denominator to the front of the list, and recurse on
        // the numerator
        denominatorList.unshift(node.args[1]);
        node = node.args[0];
    }
    // unshift the final node, which wasn't a / node
    denominatorList.unshift(node);
    return denominatorList;
}
module.exports = search;
//# sourceMappingURL=index.js.map