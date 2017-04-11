"use strict";
var arithmeticSearch = require("../arithmeticSearch");
var clone = require("../../util/clone");
var collectAndCombineSearch = require("../collectAndCombineSearch");
var rearrangeCoefficient = require("../basicsSearch/rearrangeCoefficient");
var ChangeTypes = require("../../ChangeTypes");
var Negative = require("../../Negative");
var mathNode = require("../../mathnode");
var TreeSearch = require("../../TreeSearch");
var search = TreeSearch.postOrder(distribute);
function distribute(node) {
    if (mathNode.Type.isUnaryMinus(node)) {
        return distributeUnaryMinus(node);
    }
    else if (mathNode.Type.isOperator(node)) {
        return distributeAndSimplifyOperationNode(node);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
function distributeUnaryMinus(node) {
    if (!mathNode.Type.isUnaryMinus(node)) {
        return mathNode.Status.noChange(node);
    }
    var unaryContent = node.args[0];
    if (!mathNode.Type.isParenthesis(unaryContent)) {
        return mathNode.Status.noChange(node);
    }
    var content = unaryContent.content;
    if (!mathNode.Type.isOperator(content)) {
        return mathNode.Status.noChange(node);
    }
    var newContent = clone(content);
    node.changeGroup = 1;
    // For multiplication and division, we can push the unary minus in to
    // the first argument.
    // e.g. -(2/3) -> (-2/3)    -(4*9*x^2) --> (-4 * 9  * x^2)
    if (content.op === "*" || content.op === "/") {
        newContent.args[0] = Negative.negate(newContent.args[0]);
        newContent.args[0].changeGroup = 1;
        var newNode = mathNode.Creator.parenthesis(newContent);
        return mathNode.Status.nodeChanged(ChangeTypes.DISTRIBUTE_NEGATIVE_ONE, node, newNode, false);
    }
    else if (content.op === "+") {
        // Now we know `node` is of the form -(x + y + ...).
        // We want to now return (-x + -y + ....)
        // If any term is negative, we make it positive it right away
        // e.g. -(2-4) => -2 + 4
        var newArgs = newContent.args.map(function (arg) {
            var newArg = Negative.negate(arg);
            newArg.changeGroup = 1;
            return newArg;
        });
        newContent.args = newArgs;
        var newNode = mathNode.Creator.parenthesis(newContent);
        return mathNode.Status.nodeChanged(ChangeTypes.DISTRIBUTE_NEGATIVE_ONE, node, newNode, false);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
function distributeAndSimplifyOperationNode(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== "*") {
        return mathNode.Status.noChange(node);
    }
    // STEP 1: distribute with `distributeTwoNodes`
    // e.g. x*(2+x) -> x*2 + x*x
    // STEP 2: simplifications of each operand in the new sum with `simplify`
    // e.g. x*2 + x*x -> ... -> 2x + x^2
    for (var i = 0; i + 1 < node.args.length; i++) {
        if (!isParenthesisOfAddition(node.args[i]) &&
            !isParenthesisOfAddition(node.args[i + 1])) {
            continue;
        }
        var newNode = clone(node);
        var substeps = [];
        var status_1 = void 0;
        var combinedNode = distributeTwoNodes(newNode.args[i], newNode.args[i + 1]);
        node.args[i].changeGroup = 1;
        node.args[i + 1].changeGroup = 1;
        combinedNode.changeGroup = 1;
        if (newNode.args.length > 2) {
            newNode.args.splice(i, 2, combinedNode);
            newNode.args[i].changeGroup = 1;
        }
        else {
            newNode = combinedNode;
            newNode.changeGroup = 1;
        }
        status_1 = mathNode.Status.nodeChanged(ChangeTypes.DISTRIBUTE, node, newNode, false);
        substeps.push(status_1);
        newNode = mathNode.Status.resetChangeGroups(status_1.newNode);
        // case 1: there were more than two operands in this multiplication
        // e.g. 3*7*(2+x)*(3+x)*(4+x) is a multiplication node with 5 children
        // and the new node will be 3*(14+7x)*(3+x)*(4+x) with 4 children.
        if (mathNode.Type.isOperator(newNode, "*")) {
            var childStatus = simplifyWithParens(newNode.args[i]);
            if (childStatus.hasChanged()) {
                status_1 = mathNode.Status.childChanged(newNode, childStatus, i);
                substeps.push(status_1);
                newNode = mathNode.Status.resetChangeGroups(status_1.newNode);
            }
        }
        else if (mathNode.Type.isParenthesis(newNode)) {
            status_1 = simplifyWithParens(newNode);
            if (status_1.hasChanged()) {
                substeps.push(status_1);
                newNode = mathNode.Status.resetChangeGroups(status_1.newNode);
            }
        }
        else {
            throw Error("Unsupported node type for distribution: " + node);
        }
        if (substeps.length === 1) {
            return substeps[0];
        }
        return mathNode.Status.nodeChanged(ChangeTypes.DISTRIBUTE, node, newNode, false, substeps);
    }
    return mathNode.Status.noChange(node);
}
function distributeTwoNodes(firstNode, secondNode) {
    // lists of terms we'll be multiplying together from each node
    var firstArgs, secondArgs;
    if (isParenthesisOfAddition(firstNode)) {
        firstArgs = firstNode.content.args;
    }
    else {
        firstArgs = [firstNode];
    }
    if (isParenthesisOfAddition(secondNode)) {
        secondArgs = secondNode.content.args;
    }
    else {
        secondArgs = [secondNode];
    }
    // the new operands under addition, now products of terms
    var newArgs = [];
    // if exactly one group contains at least one fraction, multiply the
    // non-fraction group into the numerators of the fraction group
    if ([firstArgs, secondArgs].filter(hasFraction).length === 1) {
        var firstArgsHasFraction = hasFraction(firstArgs);
        var fractionNodes = firstArgsHasFraction ? firstArgs : secondArgs;
        var nonFractionTerm_1 = firstArgsHasFraction ? secondNode : firstNode;
        fractionNodes.forEach(function (node) {
            var arg;
            if (isFraction(node)) {
                var numerator = mathNode.Creator.operator("*", [node.args[0], nonFractionTerm_1]);
                numerator = mathNode.Creator.parenthesis(numerator);
                arg = mathNode.Creator.operator("/", [numerator, node.args[1]]);
            }
            else {
                arg = mathNode.Creator.operator("*", [node, nonFractionTerm_1]);
            }
            arg.changeGroup = 1;
            newArgs.push(arg);
        });
    }
    else if (firstArgs.length > 1 && secondArgs.length > 1) {
        firstArgs.forEach(function (leftArg) {
            var arg = mathNode.Creator.operator("*", [leftArg, secondNode]);
            arg.changeGroup = 1;
            newArgs.push(arg);
        });
    }
    else {
        // a list of all pairs of nodes between the two arg lists
        firstArgs.forEach(function (leftArg) {
            secondArgs.forEach(function (rightArg) {
                var arg = mathNode.Creator.operator("*", [leftArg, rightArg]);
                arg.changeGroup = 1;
                newArgs.push(arg);
            });
        });
    }
    return mathNode.Creator.parenthesis(mathNode.Creator.operator("+", newArgs));
}
function hasFraction(args) {
    return args.filter(isFraction).length > 0;
}
function isFraction(node) {
    return mathNode.Type.isOperator(node, "/");
}
function simplifyWithParens(node) {
    if (!mathNode.Type.isParenthesis(node)) {
        throw Error("expected " + node + " to be a parenthesis node");
    }
    var status = simplify(node.content);
    if (status.hasChanged()) {
        return mathNode.Status.childChanged(node, status);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
function simplify(node) {
    var substeps = [];
    var simplifyFunctions = [
        arithmeticSearch,
        rearrangeCoefficient,
        collectAndCombineSearch,
        distributeAndSimplifyOperationNode,
    ];
    var newNode = clone(node);
    for (var i = 0; i < newNode.args.length; i++) {
        for (var j = 0; j < simplifyFunctions.length; j++) {
            var childStatus = simplifyFunctions[j](newNode.args[i]);
            if (childStatus.hasChanged()) {
                var status_2 = mathNode.Status.childChanged(newNode, childStatus, i);
                substeps.push(status_2);
                newNode = mathNode.Status.resetChangeGroups(status_2.newNode);
            }
        }
    }
    // possible in cases like 2(x + y) -> 2x + 2y -> doesn't need simplifying
    if (substeps.length === 0) {
        return mathNode.Status.noChange(node);
    }
    else {
        return mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_TERMS, node, newNode, false, substeps);
    }
}
function isParenthesisOfAddition(node) {
    if (!mathNode.Type.isParenthesis(node)) {
        return false;
    }
    var content = node.content;
    return mathNode.Type.isOperator(content, "+");
}
module.exports = search;
//# sourceMappingURL=index.js.map