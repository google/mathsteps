"use strict";
var addConstantFractions = require("./addConstantFractions");
var clone = require("../../util/clone");
var ChangeTypes = require("../../ChangeTypes");
var evaluate = require("../../util/evaluate");
var mathNode = require("../../mathnode");
function addConstantAndFraction(node) {
    if (!mathNode.Type.isOperator(node) || node.op !== '+' || node.args.length !== 2) {
        return mathNode.Status.noChange(node);
    }
    var firstArg = node.args[0];
    var secondArg = node.args[1];
    var constNode, fractionNode;
    if (mathNode.Type.isConstant(firstArg)) {
        if (mathNode.Type.isIntegerFraction(secondArg)) {
            constNode = firstArg;
            fractionNode = secondArg;
        }
        else {
            return mathNode.Status.noChange(node);
        }
    }
    else if (mathNode.Type.isConstant(secondArg)) {
        if (mathNode.Type.isIntegerFraction(firstArg)) {
            constNode = secondArg;
            fractionNode = firstArg;
        }
        else {
            return mathNode.Status.noChange(node);
        }
    }
    else {
        return mathNode.Status.noChange(node);
    }
    var newNode = clone(node);
    var substeps = [];
    // newConstNode and newFractionNode will end up both constants, or both
    // fractions. I'm naming them based on their original form so we can keep
    // track of which is which.
    var newConstNode, newFractionNode;
    var changeType;
    if (parseFloat(constNode.value) % 1 === 0) {
        var denominatorNode = fractionNode.args[1];
        var denominatorValue = parseInt(denominatorNode);
        var constNodeValue = parseInt(constNode.value);
        var newNumeratorNode = mathNode.Creator.constant(constNodeValue * denominatorValue);
        newConstNode = mathNode.Creator.operator('/', [newNumeratorNode, denominatorNode]);
        newFractionNode = fractionNode;
        changeType = ChangeTypes.CONVERT_INTEGER_TO_FRACTION;
    }
    else {
        // round to 4 decimal places
        var dividedValue = evaluate(fractionNode);
        if (dividedValue < 1) {
            dividedValue = parseFloat(dividedValue.toPrecision(4));
        }
        else {
            dividedValue = parseFloat(dividedValue.toFixed(4));
        }
        newFractionNode = mathNode.Creator.constant(dividedValue);
        newConstNode = constNode;
        changeType = ChangeTypes.DIVIDE_FRACTION_FOR_ADDITION;
    }
    if (mathNode.Type.isConstant(firstArg)) {
        newNode.args[0] = newConstNode;
        newNode.args[1] = newFractionNode;
    }
    else {
        newNode.args[0] = newFractionNode;
        newNode.args[1] = newConstNode;
    }
    substeps.push(mathNode.Status.nodeChanged(changeType, node, newNode));
    newNode = mathNode.Status.resetChangeGroups(newNode);
    // If we changed an integer to a fraction, we need to add the steps for
    // adding the fractions.
    if (changeType === ChangeTypes.CONVERT_INTEGER_TO_FRACTION) {
        var addFractionStatus = addConstantFractions(newNode);
        substeps = substeps.concat(addFractionStatus.substeps);
    }
    else {
        var evalNode = mathNode.Creator.constant(evaluate(newNode));
        substeps.push(mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, newNode, evalNode));
    }
    var lastStep = substeps[substeps.length - 1];
    newNode = mathNode.Status.resetChangeGroups(lastStep.newNode);
    return mathNode.Status.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, substeps);
}
module.exports = addConstantAndFraction;
//# sourceMappingURL=addConstantAndFraction.js.map