/// <reference path="../../node_modules/@types/mathjs/index.d.ts"/>
/*
  For determining the type of a mathJS node.
 */

class NodeType {
    static isOperator(node: mathjs.MathNode, operator = null) {
        return node.type === "OperatorNode" &&
            node.fn !== "unaryMinus" &&
            ("*+-/^".lastIndexOf(node.op) !== -1) &&
            (operator ? node.op === operator : true);
    };
    static isParenthesis(node: mathjs.MathNode) {
        return node.type === "ParenthesisNode";
    };
    static isUnaryMinus(node: mathjs.MathNode) {
        return node.type === "OperatorNode" && node.fn === "unaryMinus";
    };
    static isFunction(node: mathjs.MathNode, functionName = null) {
        if (node.type !== "FunctionNode") {
            return false;
        }
        if (functionName && node.fn !== functionName) {
            return false;
        }
        return true;
    };
    static isSymbol(node: mathjs.MathNode, allowUnaryMinus = true) {
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
    static isConstant(node: mathjs.MathNode, allowUnaryMinus = false) {
        if (node.type === "ConstantNode") {
            return true;
        }
        else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
            if (NodeType.isConstant(node.args[0], false)) {
                const value = parseFloat(node.args[0].value);
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
    static isConstantFraction(node: mathjs.MathNode, allowUnaryMinus = false) {
        if (NodeType.isOperator(node, '/')) {
            return node.args.every(n => NodeType.isConstant(n, allowUnaryMinus));
        }
        else {
            return false;
        }
    };
    static isConstantOrConstantFraction(node: mathjs.MathNode, allowUnaryMinus = false) {
        if (NodeType.isConstant(node, allowUnaryMinus) ||
            NodeType.isConstantFraction(node, allowUnaryMinus)) {
            return true;
        }
        else {
            return false;
        }
    };
    isIntegerFraction(node: mathjs.MathNode, allowUnaryMinus = false) {
        if (!NodeType.isConstantFraction(node, allowUnaryMinus)) {
            return false;
        }
        let [numerator, denominator] = node.args;
        if (allowUnaryMinus) {
            if (NodeType.isUnaryMinus(numerator)) {
                numerator = numerator.args[0];
            }
            if (NodeType.isUnaryMinus(denominator)) {
                denominator = denominator.args[0];
            }
        }
        return ((parseFloat(numerator.value)% 1 ===0) &&
            (parseFloat(denominator.value)%1 === 0));
    };
}

export = NodeType;
