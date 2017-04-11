"use strict";
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
// Breaks up any fraction (deeper nodes getting priority) that has a numerator
// that is a sum. e.g. (2+x)/5 -> (2/5 + x/5)
// This step must happen after things have been collected and combined, or
// else things will infinite loop, so it's a tree search of its own.
// Returns a mathNode.Status object
var search = TreeSearch.postOrder(breakUpNumerator);
function breakUpNumerator(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== "/") {
        return mathNode.Status.noChange(node);
    }
    var numerator = node.args[0];
    if (mathNode.Type.isParenthesis(numerator)) {
        numerator = numerator.content;
    }
    if (!mathNode.Type.isOperator(numerator) || numerator.op !== "+") {
        return mathNode.Status.noChange(node);
    }
    // At this point, we know that node is a fraction and its numerator is a sum
    // of terms that can't be collected or combined, so we should break it up.
    var fractionList = [];
    var denominator = node.args[1];
    numerator.args.forEach(function (arg) {
        var newFraction = mathNode.Creator.operator("/", [arg, denominator]);
        newFraction.changeGroup = 1;
        fractionList.push(newFraction);
    });
    var newNode = mathNode.Creator.operator("+", fractionList);
    // Wrap in parens for cases like 2*(2+3)/5 => 2*(2/5 + 3/5)
    newNode = mathNode.Creator.parenthesis(newNode);
    node.changeGroup = 1;
    return mathNode.Status.nodeChanged(ChangeTypes.BREAK_UP_FRACTION, node, newNode, false);
}
module.exports = search;
//# sourceMappingURL=index.js.map