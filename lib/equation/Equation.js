"use strict";
/// <reference path="../../node_modules/@types/mathjs/index.d.ts"/>
var math = require("mathjs");
var clone = require("../util/clone");
var printNode = require("../util/print");
// This represents an equation, made up of the leftNode (LHS), the
// rightNode (RHS) and a comparator (=, <, >, <=, or >=)
var Equation = (function () {
    function Equation(leftNode, rightNode, comparator) {
        this.leftNode = leftNode;
        this.rightNode = rightNode;
        this.comparator = comparator;
    }
    // Prints an Equation properly using the print module
    Equation.prototype.print = function (showPlusMinus) {
        if (showPlusMinus === void 0) { showPlusMinus = false; }
        var leftSide = printNode(this.leftNode, showPlusMinus);
        var rightSide = printNode(this.rightNode, showPlusMinus);
        var comparator = this.comparator;
        return leftSide + " " + comparator + " " + rightSide;
    };
    Equation.prototype.clone = function () {
        var newLeft = clone(this.leftNode);
        var newRight = clone(this.rightNode);
        return new Equation(newLeft, newRight, this.comparator);
    };
    return Equation;
}());
// Splits a string on the given comparator and returns a new Equation object
// from the left and right hand sides
Equation.createEquationFromString = function (str, comparator) {
    var sides = str.split(comparator);
    if (sides.length !== 2) {
        throw Error("Expected two sides of an equation using comparator: " +
            comparator);
    }
    var leftNode = math.parse(sides[0]);
    var rightNode = math.parse(sides[1]);
    return new Equation(leftNode, rightNode, comparator);
};
module.exports = Equation;
//# sourceMappingURL=Equation.js.map