"use strict";
var checks = require("../../checks");
var clone = require("../../util/clone");
var evaluateConstantSum = require("./evaluateConstantSum");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// Adds a list of nodes that are polynomial terms. Returns a mathNode.Status object.
function addLikeTerms(node, polynomialOnly) {
    if (polynomialOnly === void 0) { polynomialOnly = false; }
    if (!mathNode.Type.isOperator(node)) {
        return mathNode.Status.noChange(node);
    }
    var status;
    if (!polynomialOnly) {
        status = evaluateConstantSum(node);
        if (status.hasChanged()) {
            return status;
        }
    }
    status = addLikePolynomialTerms(node);
    if (status.hasChanged()) {
        return status;
    }
    return mathNode.Status.noChange(node);
}
function addLikePolynomialTerms(node) {
    if (!checks.canAddLikeTermPolynomialNodes(node)) {
        return mathNode.Status.noChange(node);
    }
    var substeps = [];
    var newNode = clone(node);
    // STEP 1: If any nodes have no coefficient, make it have coefficient 1
    // (this step only happens under certain conditions and later steps might
    // happen even if step 1 does not)
    var status = addPositiveOneCoefficient(newNode);
    if (status.hasChanged()) {
        substeps.push(status);
        newNode = mathNode.Status.resetChangeGroups(status.newNode);
    }
    // STEP 2: If any nodes have a unary minus, make it have coefficient -1
    // (this step only happens under certain conditions and later steps might
    // happen even if step 2 does not)
    status = addNegativeOneCoefficient(newNode);
    if (status.hasChanged()) {
        substeps.push(status);
        newNode = mathNode.Status.resetChangeGroups(status.newNode);
    }
    // STEP 3: group the coefficients in a sum
    status = groupCoefficientsForAdding(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
    // STEP 4: evaluate the sum (could include fractions)
    status = evaluateCoefficientSum(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
    return mathNode.Status.nodeChanged(ChangeTypes.ADD_POLYNOMIAL_TERMS, node, newNode, true, substeps);
}
function addPositiveOneCoefficient(node) {
    var newNode = clone(node);
    var change = false;
    var changeGroup = 1;
    newNode.args.forEach(function (child, i) {
        var polyTerm = new mathNode.PolynomialTerm(child);
        if (polyTerm.getCoeffValue() === 1) {
            newNode.args[i] = mathNode.Creator.polynomialTerm(polyTerm.getSymbolNode(), polyTerm.getExponentNode(), mathNode.Creator.constant(1), true /* explicit coefficient */);
            newNode.args[i].changeGroup = changeGroup;
            node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"
            change = true;
            changeGroup++;
        }
    });
    if (change) {
        return mathNode.Status.nodeChanged(ChangeTypes.ADD_COEFFICIENT_OF_ONE, node, newNode, false);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
function addNegativeOneCoefficient(node) {
    var newNode = clone(node);
    var change = false;
    var changeGroup = 1;
    newNode.args.forEach(function (child, i) {
        var polyTerm = new mathNode.PolynomialTerm(child);
        if (polyTerm.getCoeffValue() === -1) {
            newNode.args[i] = mathNode.Creator.polynomialTerm(polyTerm.getSymbolNode(), polyTerm.getExponentNode(), polyTerm.getCoeffNode(), true /* explicit -1 coefficient */);
            node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"
            newNode.args[i].changeGroup = changeGroup;
            change = true;
            changeGroup++;
        }
    });
    if (change) {
        return mathNode.Status.nodeChanged(ChangeTypes.UNARY_MINUS_TO_NEGATIVE_ONE, node, newNode, false);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
function groupCoefficientsForAdding(node) {
    var newNode = clone(node);
    var polynomialTermList = newNode.args.map(function (n) { return new mathNode.PolynomialTerm(n); });
    var coefficientList = polynomialTermList.map(function (p) { return p.getCoeffNode(true); });
    var sumOfCoefficents = mathNode.Creator.parenthesis(mathNode.Creator.operator("+", coefficientList));
    // TODO: changegroups should also be on the before node, on all the
    // coefficients, but changegroups with polyTerm gets messy so let's tackle
    // that later.
    sumOfCoefficents.changeGroup = 1;
    // Polynomial terms that can be added together must share the same symbol
    // name and exponent. Get that name and exponent from the first term
    var firstTerm = polynomialTermList[0];
    var exponentNode = firstTerm.getExponentNode();
    var symbolNode = firstTerm.getSymbolNode();
    newNode = mathNode.Creator.polynomialTerm(symbolNode, exponentNode, sumOfCoefficents);
    return mathNode.Status.nodeChanged(ChangeTypes.GROUP_COEFFICIENTS, node, newNode);
}
function evaluateCoefficientSum(node) {
    // the node is now always a * node with the left child the coefficent sum
    // e.g. (2 + 4 + 5) and the right node the symbol part e.g. x or y^2
    // so we want to evaluate args[0]
    var coefficientSum = clone(node).args[0];
    var childStatus = evaluateConstantSum(coefficientSum);
    return mathNode.Status.childChanged(node, childStatus, 0);
}
module.exports = addLikeTerms;
//# sourceMappingURL=addLikeTerms.js.map