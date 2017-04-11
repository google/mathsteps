"use strict";
var checks = require("../checks");
var LikeTermCollector = require("../simplifyExpression/collectAndCombineSearch/LikeTermCollector");
var mathNode = require("../mathNode");
// Removes any parenthesis around nodes that can't be resolved further.
// Input must be a top level expression.
// Returns a node.
function removeUnnecessaryParens(node, rootNode) {
    if (rootNode === void 0) { rootNode = false; }
    // Parens that wrap everything are redundant.
    // NOTE: removeUnnecessaryParensSearch recursively removes parens that aren't
    // needed, while this step only applies to the very top level expression.
    // e.g. (2 + 3) * 4 can't become 2 + 3 * 4, but if (2 + 3) as a top level
    // expression can become 2 + 3
    if (rootNode) {
        while (mathNode.Type.isParenthesis(node)) {
            node = node.content;
        }
    }
    return removeUnnecessaryParensSearch(node);
}
// Recursively moves parenthesis around nodes that can't be resolved further if
// it doesn't change the value of the expression. Returns a node.
// NOTE: after this function is called, every parenthesis node in the
// tree should always have an operator node or unary minus as its child.
function removeUnnecessaryParensSearch(node) {
    if (mathNode.Type.isOperator(node)) {
        return removeUnnecessaryParensInOperatorNode(node);
    }
    else if (mathNode.Type.isFunction(node)) {
        return removeUnnecessaryParensInFunctionNode(node);
    }
    else if (mathNode.Type.isParenthesis(node)) {
        return removeUnnecessaryParensInParenthesisNode(node);
    }
    else if (mathNode.Type.isConstant(node, true) || mathNode.Type.isSymbol(node)) {
        return node;
    }
    else if (mathNode.Type.isUnaryMinus(node)) {
        var content = node.args[0];
        node.args[0] = removeUnnecessaryParensSearch(content);
        return node;
    }
    else {
        throw Error('Unsupported node type: ' + node.type);
    }
}
function removeUnnecessaryParensInOperatorNode(node) {
    // Special case: if the node is an exponent node and the base
    // is an operator, we should keep the parentheses for the base.
    // e.g. (2x)^2 -> (2x)^2 instead of 2x^2
    if (node.op === '^' && mathNode.Type.isParenthesis(node.args[0])) {
        var base = node.args[0];
        if (mathNode.Type.isOperator(base.content)) {
            base.content = removeUnnecessaryParensSearch(base.content);
            node.args[1] = removeUnnecessaryParensSearch(node.args[1]);
            return node;
        }
    }
    node.args.forEach(function (child, i) {
        node.args[i] = removeUnnecessaryParensSearch(child);
    });
    // Sometimes, parens are around expressions that have been simplified
    // all they can be. If that expression is part of an addition or subtraction
    // operation, we can remove the parenthesis.
    // e.g. (x+4) + 12 -> x+4 + 12
    if (node.op === '+') {
        node.args.forEach(function (child, i) {
            if (mathNode.Type.isParenthesis(child) &&
                !canCollectOrCombine(child.content)) {
                // remove the parens by replacing the child node (in its args list)
                // with its content
                node.args[i] = child.content;
            }
        });
    }
    else if (node.op === '-') {
        if (mathNode.Type.isParenthesis(node.args[0]) &&
            !canCollectOrCombine(node.args[0].content)) {
            node.args[0] = node.args[0].content;
        }
    }
    return node;
}
function removeUnnecessaryParensInFunctionNode(node) {
    node.args.forEach(function (child, i) {
        if (mathNode.Type.isParenthesis(child)) {
            child = child.content;
        }
        node.args[i] = removeUnnecessaryParensSearch(child);
    });
    return node;
}
function removeUnnecessaryParensInParenthesisNode(node) {
    // polynomials terms can be complex trees (e.g. 3x^2/5) but don't need parens
    // around them
    if (mathNode.PolynomialTerm.isPolynomialTerm(node.content)) {
        // also recurse to remove any unnecessary parens within the term
        // (e.g. the exponent might have parens around it)
        if (node.content.args) {
            node.content.args.forEach(function (arg, i) {
                node.content.args[i] = removeUnnecessaryParensSearch(arg);
            });
        }
        node = node.content;
    }
    else if (mathNode.Type.isConstant(node.content, true) ||
        mathNode.Type.isIntegerFraction(node.content) ||
        mathNode.Type.isSymbol(node.content)) {
        node = node.content;
    }
    else if (mathNode.Type.isFunction(node.content)) {
        node = node.content;
        node = removeUnnecessaryParensSearch(node);
    }
    else if (mathNode.Type.isOperator(node.content)) {
        node.content = removeUnnecessaryParensSearch(node.content);
        // exponent nodes don't need parens around them
        if (node.content.op === '^') {
            node = node.content;
        }
    }
    else if (mathNode.Type.isParenthesis(node.content)) {
        node = removeUnnecessaryParensSearch(node.content);
    }
    else if (mathNode.Type.isUnaryMinus(node.content)) {
        node.content = removeUnnecessaryParensSearch(node.content);
    }
    else {
        throw Error('Unsupported node type: ' + node.content.type);
    }
    return node;
}
// Returns true if any of the collect or combine steps can be applied to the
// expression tree `node`.
function canCollectOrCombine(node) {
    return LikeTermCollector.canCollectLikeTerms(node) ||
        checks.resolvesToConstant(node) ||
        checks.canSimplifyPolynomialTerms(node);
}
module.exports = removeUnnecessaryParens;
//# sourceMappingURL=removeUnnecessaryParens.js.map