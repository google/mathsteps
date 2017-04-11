"use strict";
var addConstantAndFraction = require("../fractionsSearch/addConstantAndFraction");
var addConstantFractions = require("../fractionsSearch/addConstantFractions");
var arithmeticSearch = require("../arithmeticSearch");
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
function evaluateConstantSum(node) {
    if (mathNode.Type.isParenthesis(node)) {
        node = node.content;
    }
    if (!mathNode.Type.isOperator(node) || node.op !== "+") {
        return mathNode.Status.noChange(node);
    }
    if (node.args.some(function (node) { return !mathNode.Type.isConstantOrConstantFraction(node); })) {
        return mathNode.Status.noChange(node);
    }
    // functions needed to evaluate the sum
    var summingFunctions = [
        arithmeticSearch,
        addConstantFractions,
        addConstantAndFraction,
    ];
    for (var i = 0; i < summingFunctions.length; i++) {
        var status_1 = summingFunctions[i](node);
        if (status_1.hasChanged()) {
            if (mathNode.Type.isConstantOrConstantFraction(status_1.newNode)) {
                return status_1;
            }
        }
    }
    var newNode = clone(node);
    var substeps = [];
    var status;
    // STEP 1: group fractions and constants separately
    status = groupConstantsAndFractions(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
    var constants = newNode.args[0];
    var fractions = newNode.args[1];
    // STEP 2A: evaluate arithmetic IF there's > 1 constant
    // (which is the case if it's a list surrounded by parenthesis)
    if (mathNode.Type.isParenthesis(constants)) {
        var constantList = constants.content;
        var evaluateStatus = arithmeticSearch(constantList);
        status = mathNode.Status.childChanged(newNode, evaluateStatus, 0);
        substeps.push(status);
        newNode = mathNode.Status.resetChangeGroups(status.newNode);
    }
    // STEP 2B: add fractions IF there's > 1 fraction
    // (which is the case if it's a list surrounded by parenthesis)
    if (mathNode.Type.isParenthesis(fractions)) {
        var fractionList = fractions.content;
        var evaluateStatus = addConstantFractions(fractionList);
        status = mathNode.Status.childChanged(newNode, evaluateStatus, 1);
        substeps.push(status);
        newNode = mathNode.Status.resetChangeGroups(status.newNode);
    }
    // STEP 3: combine the evaluated constant and fraction
    // the fraction might have simplified to a constant (e.g. 1/3 + 2/3 -> 2)
    // so we just call evaluateConstantSum again to cycle through
    status = evaluateConstantSum(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
    return mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, substeps);
}
function groupConstantsAndFractions(node) {
    var fractions = node.args.filter(mathNode.Type.isIntegerFraction);
    var constants = node.args.filter(mathNode.Type.isConstant);
    if (fractions.length === 0 || constants.length === 0) {
        throw Error("expected both integer fractions and constants, got " + node);
    }
    if (fractions.length + constants.length !== node.args.length) {
        throw Error("can only evaluate integer fractions and constants");
    }
    constants = constants.map(function (node) {
        // set the changeGroup - this affects both the old and new node
        node.changeGroup = 1;
        // clone so that node and newNode aren't stored in the same memory
        return clone(node);
    });
    // wrap in parenthesis if there's more than one, to group them
    if (constants.length > 1) {
        constants = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", constants));
    }
    else {
        constants = constants[0];
    }
    fractions = fractions.map(function (node) {
        // set the changeGroup - this affects both the old and new node
        node.changeGroup = 2;
        // clone so that node and newNode aren't stored in the same memory
        return clone(node);
    });
    // wrap in parenthesis if there's more than one, to group them
    if (fractions.length > 1) {
        fractions = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", fractions));
    }
    else {
        fractions = fractions[0];
    }
    var newNode = mathNode.Creator.operator("+", [constants, fractions]);
    return mathNode.Status.nodeChanged(ChangeTypes.COLLECT_LIKE_TERMS, node, newNode);
}
module.exports = evaluateConstantSum;
//# sourceMappingURL=evaluateConstantSum.js.map