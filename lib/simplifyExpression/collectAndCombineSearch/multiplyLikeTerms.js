"use strict";
var arithmeticSearch = require("../arithmeticSearch");
var checks = require("../../checks");
var clone = require("../../util/clone");
var multiplyFractionsSearch = require("../multiplyFractionsSearch");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
// Multiplies a list of nodes that are polynomial like terms. Returns a node.
// The polynomial nodes should *not* have coefficients. (multiplying
// coefficients is handled in collecting like terms for multiplication)
function multiplyLikeTerms(node, polynomialOnly) {
    if (polynomialOnly === void 0) { polynomialOnly = false; }
    if (!mathNode.Type.isOperator(node)) {
        return mathNode.Status.noChange(node);
    }
    var status;
    if (!polynomialOnly) {
        status = arithmeticSearch(node);
        if (status.hasChanged()) {
            status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
            return status;
        }
        status = multiplyFractionsSearch(node);
        if (status.hasChanged()) {
            status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
            return status;
        }
    }
    status = multiplyPolynomialTerms(node);
    if (status.hasChanged()) {
        status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
        return status;
    }
    return mathNode.Status.noChange(node);
}
function multiplyPolynomialTerms(node) {
    if (!checks.canMultiplyLikeTermPolynomialNodes(node)) {
        return mathNode.Status.noChange(node);
    }
    var substeps = [];
    var newNode = clone(node);
    // STEP 1: If any term has no exponent, make it have exponent 1
    // e.g. x -> x^1 (this is for pedagogy reasons)
    // (this step only happens under certain conditions and later steps might
    // happen even if step 1 does not)
    var status = addOneExponent(newNode);
    if (status.hasChanged()) {
        substeps.push(status);
        newNode = mathNode.Status.resetChangeGroups(status.newNode);
    }
    // STEP 2: collect exponents to a single exponent sum
    // e.g. x^1 * x^3 -> x^(1+3)
    status = collectExponents(newNode);
    substeps.push(status);
    newNode = mathNode.Status.resetChangeGroups(status.newNode);
    // STEP 3: add exponents together.
    // NOTE: This might not be a step if the exponents aren't all constants,
    // but this case isn't that common and can be caught in other steps.
    // e.g. x^(2+4+z)
    // TODO: handle fractions, combining and collecting like terms, etc, here
    var exponentSum = newNode.args[1].content;
    var sumStatus = arithmeticSearch(exponentSum);
    if (sumStatus.hasChanged()) {
        status = mathNode.Status.childChanged(newNode, sumStatus, 1);
        substeps.push(status);
        newNode = mathNode.Status.resetChangeGroups(status.newNode);
    }
    if (substeps.length === 1) {
        return substeps[0];
    }
    else {
        return mathNode.Status.nodeChanged(ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS, node, newNode, true, substeps);
    }
}
function addOneExponent(node) {
    var newNode = clone(node);
    var change = false;
    var changeGroup = 1;
    newNode.args.forEach(function (child, i) {
        var polyTerm = new mathNode.PolynomialTerm(child);
        if (!polyTerm.getExponentNode()) {
            newNode.args[i] = mathNode.Creator.polynomialTerm(polyTerm.getSymbolNode(), mathNode.Creator.constant(1), polyTerm.getCoeffNode());
            newNode.args[i].changeGroup = changeGroup;
            node.args[i].changeGroup = changeGroup; // note that this is the "oldNode"
            change = true;
            changeGroup++;
        }
    });
    if (change) {
        return mathNode.Status.nodeChanged(ChangeTypes.ADD_EXPONENT_OF_ONE, node, newNode, false);
    }
    else {
        return mathNode.Status.noChange(node);
    }
}
function collectExponents(node) {
    var polynomialTermList = node.args.map(function (n) { return new mathNode.PolynomialTerm(n); });
    // If we're multiplying polynomial nodes together, they all share the same
    // symbol. Get that from the first node.
    var symbolNode = polynomialTermList[0].getSymbolNode();
    // The new exponent will be a sum of exponents (an operation, wrapped in
    // parens) e.g. x^(3+4+5)
    var exponentNodeList = polynomialTermList.map(function (p) { return p.getExponentNode(true); });
    var newExponent = mathNode.Creator.parenthesis(mathNode.Creator.operator('+', exponentNodeList));
    var newNode = mathNode.Creator.polynomialTerm(symbolNode, newExponent, null);
    return mathNode.Status.nodeChanged(ChangeTypes.COLLECT_EXPONENTS, node, newNode);
}
module.exports = multiplyLikeTerms;
//# sourceMappingURL=multiplyLikeTerms.js.map