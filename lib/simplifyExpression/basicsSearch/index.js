/*
 * Performs simpifications that are more basic and overaching like (...)^0 => 1
 * These are always the first simplifications that are attempted.
 */
"use strict";
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
var rearrangeCoefficient = require("./rearrangeCoefficient");
var reduceExponentByZero = require("./reduceExponentByZero");
var reduceMultiplicationByZero = require("./reduceMultiplicationByZero");
var reduceZeroDividedByAnything = require("./reduceZeroDividedByAnything");
var removeAdditionOfZero = require("./removeAdditionOfZero");
var removeDivisionByOne = require("./removeDivisionByOne");
var removeExponentBaseOne = require("./removeExponentBaseOne");
var removeExponentByOne = require("./removeExponentByOne");
var removeMultiplicationByNegativeOne = require("./removeMultiplicationByNegativeOne");
var removeMultiplicationByOne = require("./removeMultiplicationByOne");
var simplifyDoubleUnaryMinus = require("./simplifyDoubleUnaryMinus");
var simplificationFunctions = [
    // multiplication by 0 yields 0
    reduceMultiplicationByZero,
    // division of 0 by something yields 0
    reduceZeroDividedByAnything,
    // ____^0 --> 1
    reduceExponentByZero,
    // Check for x^1 which should be reduced to x
    removeExponentByOne,
    // Check for 1^x which should be reduced to 1
    // if x can be simplified to a constant
    removeExponentBaseOne,
    // - - becomes +
    simplifyDoubleUnaryMinus,
    // If this is a + node and one of the operands is 0, get rid of the 0
    removeAdditionOfZero,
    // If this is a * node and one of the operands is 1, get rid of the 1
    removeMultiplicationByOne,
    // In some cases, remove multiplying by -1
    removeMultiplicationByNegativeOne,
    // If this is a / node and the denominator is 1 or -1, get rid of it
    removeDivisionByOne,
    // e.g. x*5 -> 5x
    rearrangeCoefficient,
];
var search = TreeSearch.preOrder(basics);
// Look for basic step(s) to perform on a node. Returns a mathNode.Status object.
function basics(node) {
    for (var i = 0; i < simplificationFunctions.length; i++) {
        var nodeStatus = simplificationFunctions[i](node);
        if (nodeStatus.hasChanged()) {
            return nodeStatus;
        }
        else {
            node = nodeStatus.newNode;
        }
    }
    return mathNode.Status.noChange(node);
}
module.exports = search;
//# sourceMappingURL=index.js.map