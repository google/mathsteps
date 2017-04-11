"use strict";
var math = require("mathjs");
var stepThrough = require("./stepThrough");
function solveEquationString(equationString, debug) {
    if (debug === void 0) { debug = false; }
    var comparators = ["<=", ">=", "=", "<", ">"];
    for (var i = 0; i < comparators.length; i++) {
        var comparator = comparators[i];
        var sides = equationString.split(comparator);
        if (sides.length !== 2) {
            continue;
        }
        var leftNode = void 0, rightNode = void 0;
        var leftSide = sides[0].trim();
        var rightSide = sides[1].trim();
        if (!leftSide || !rightSide) {
            return [];
        }
        try {
            leftNode = math.parse(leftSide);
            rightNode = math.parse(rightSide);
        }
        catch (err) {
            return [];
        }
        if (leftNode && rightNode) {
            return stepThrough(leftNode, rightNode, comparator, debug);
        }
    }
    return [];
}
module.exports = solveEquationString;
//# sourceMappingURL=index.js.map