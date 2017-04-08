"use strict";
var mathNode = require("../mathnode");
function resolvesToConstant(node) {
    if (mathNode.Type.isOperator(node) || mathNode.Type.isFunction(node)) {
        return node.args.every(function (child) { return resolvesToConstant(child); });
    }
    else if (mathNode.Type.isParenthesis(node)) {
        return resolvesToConstant(node.content);
    }
    else if (mathNode.Type.isConstant(node, true)) {
        return true;
    }
    else if (mathNode.Type.isSymbol(node)) {
        return false;
    }
    else if (mathNode.Type.isUnaryMinus(node)) {
        return resolvesToConstant(node.args[0]);
    }
    else {
        throw Error('Unsupported node type: ' + node.type);
    }
}
module.exports = resolvesToConstant;
//# sourceMappingURL=resolvesToConstant.js.map