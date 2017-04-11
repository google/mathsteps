/// <reference path="../../node_modules/@types/mathjs/index.d.ts"/>
/*
  For determining the type of a mathJS node.
 */
"use strict";
var NodeType = (function () {
    function NodeType() {
    }
    NodeType.isOperator = function (node, operator) {
        if (operator === void 0) { operator = null; }
        return node.type === "OperatorNode" &&
            node.fn !== "unaryMinus" &&
            ("*+-/^".lastIndexOf(node.op) !== -1) &&
            (operator ? node.op === operator : true);
    };
    ;
    NodeType.isParenthesis = function (node) {
        return node.type === "ParenthesisNode";
    };
    ;
    NodeType.isUnaryMinus = function (node) {
        return node.type === "OperatorNode" && node.fn === "unaryMinus";
    };
    ;
    NodeType.isFunction = function (node, functionName) {
        if (functionName === void 0) { functionName = null; }
        if (node.type !== "FunctionNode") {
            return false;
        }
        if (functionName && node.fn !== functionName) {
            return false;
        }
        return true;
    };
    ;
    NodeType.isSymbol = function (node, allowUnaryMinus) {
        if (allowUnaryMinus === void 0) { allowUnaryMinus = true; }
        if (node.type === "SymbolNode") {
            return true;
        }
        else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
            return NodeType.isSymbol(node.args[0], false);
        }
        else {
            return false;
        }
    };
    ;
    NodeType.isConstant = function (node, allowUnaryMinus) {
        if (allowUnaryMinus === void 0) { allowUnaryMinus = false; }
        if (node.type === "ConstantNode") {
            return true;
        }
        else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
            if (NodeType.isConstant(node.args[0], false)) {
                var value = parseFloat(node.args[0].value);
                return value >= 0;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    };
    ;
    NodeType.isConstantFraction = function (node, allowUnaryMinus) {
        if (allowUnaryMinus === void 0) { allowUnaryMinus = false; }
        if (NodeType.isOperator(node, '/')) {
            return node.args.every(function (n) { return NodeType.isConstant(n, allowUnaryMinus); });
        }
        else {
            return false;
        }
    };
    ;
    NodeType.isConstantOrConstantFraction = function (node, allowUnaryMinus) {
        if (allowUnaryMinus === void 0) { allowUnaryMinus = false; }
        if (NodeType.isConstant(node, allowUnaryMinus) ||
            NodeType.isConstantFraction(node, allowUnaryMinus)) {
            return true;
        }
        else {
            return false;
        }
    };
    ;
    NodeType.prototype.isIntegerFraction = function (node, allowUnaryMinus) {
        if (allowUnaryMinus === void 0) { allowUnaryMinus = false; }
        if (!NodeType.isConstantFraction(node, allowUnaryMinus)) {
            return false;
        }
        var _a = node.args, numerator = _a[0], denominator = _a[1];
        if (allowUnaryMinus) {
            if (NodeType.isUnaryMinus(numerator)) {
                numerator = numerator.args[0];
            }
            if (NodeType.isUnaryMinus(denominator)) {
                denominator = denominator.args[0];
            }
        }
        return ((parseFloat(numerator.value) % 1 === 0) &&
            (parseFloat(denominator.value) % 1 === 0));
    };
    ;
    return NodeType;
}());
module.exports = NodeType;
//# sourceMappingURL=Type.js.map