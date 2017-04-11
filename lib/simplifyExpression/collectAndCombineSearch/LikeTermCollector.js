"use strict";
var clone = require("../../util/clone");
var print = require("../../util/print");
var ChangeTypes = require("../../ChangeTypes");
var mathNode = require("../../mathnode");
var Util = require("../../util/Util");
var CONSTANT = 'constant';
var CONSTANT_FRACTION = 'constantFraction';
var OTHER = 'other';
var LikeTermCollector = (function () {
    function LikeTermCollector() {
        // Collects like terms for an operation node and returns a mathNode.Status object.
        this.collectLikeTerms = function (node) {
            if (!LikeTermCollector.canCollectLikeTerms(node)) {
                return mathNode.Status.noChange(node);
            }
            var op = node.op;
            var terms;
            if (op === '+') {
                terms = getTermsForCollectingAddition(node);
            }
            else if (op === '*') {
                terms = getTermsForCollectingMultiplication(node);
            }
            else {
                throw Error('Operation not supported: ' + op);
            }
            // List the symbols alphabetically
            var termTypesSorted = Object.keys(terms)
                .filter(function (x) { return (x !== CONSTANT && x !== CONSTANT_FRACTION && x !== OTHER); })
                .sort(sortTerms);
            // Then add const
            if (terms[CONSTANT]) {
                // at the end for addition (since we'd expect x^2 + (x + x) + 4)
                if (op === '+') {
                    termTypesSorted.push(CONSTANT);
                }
                // for multipliation it should be at the front (e.g. (3*4) * x^2)
                if (op === '*') {
                    termTypesSorted.unshift(CONSTANT);
                }
            }
            if (terms[CONSTANT_FRACTION]) {
                termTypesSorted.push(CONSTANT_FRACTION);
            }
            // Collect the new operands under op.
            var newOperands = [];
            var changeGroup = 1;
            termTypesSorted.forEach(function (termType) {
                var termsOfType = terms[termType];
                if (termsOfType.length === 1) {
                    var singleTerm = clone(termsOfType[0]);
                    singleTerm.changeGroup = changeGroup;
                    newOperands.push(singleTerm);
                }
                else {
                    var termList = clone(mathNode.Creator.parenthesis(mathNode.Creator.operator(op, termsOfType)));
                    termList.changeGroup = changeGroup;
                    newOperands.push(termList);
                }
                termsOfType.forEach(function (term) {
                    term.changeGroup = changeGroup;
                });
                changeGroup++;
            });
            // then stick anything else (paren nodes, operator nodes) at the end
            if (terms[OTHER]) {
                newOperands = newOperands.concat(terms[OTHER]);
            }
            var newNode = clone(node);
            newNode.args = newOperands;
            return mathNode.Status.nodeChanged(ChangeTypes.COLLECT_LIKE_TERMS, node, newNode, false);
        };
    }
    return LikeTermCollector;
}());
// Given an expression tree, returns true if there are terms that can be
// collected
LikeTermCollector.canCollectLikeTerms = function (node) {
    // We can collect like terms through + or through *
    // Note that we never collect like terms with - or /, those expressions will
    // always be manipulated in flattenOperands so that the top level operation is
    // + or *.
    if (!(mathNode.Type.isOperator(node, '+') || mathNode.Type.isOperator(node, '*'))) {
        return false;
    }
    var terms;
    if (node.op === '+') {
        terms = getTermsForCollectingAddition(node);
    }
    else if (node.op === '*') {
        terms = getTermsForCollectingMultiplication(node);
    }
    else {
        throw Error('Operation not supported: ' + node.op);
    }
    // Conditions we need to meet to decide to to reorganize (collect) the terms:
    // - more than 1 term type
    // - more than 1 of at least one type (not including other)
    // (note that this means x^2 + x + x + 2 -> x^2 + (x + x) + 2,
    // which will be recorded as a step, but doesn't change the order of terms)
    var termTypes = Object.keys(terms);
    var filteredTermTypes = termTypes.filter(function (x) { return x !== OTHER; });
    return (termTypes.length > 1 &&
        filteredTermTypes.some(function (x) { return terms[x].length > 1; }));
};
// Polyonomial terms are collected by categorizing them by their 'name'
// which is used to separate them into groups that can be combined. getTermName
// returns this group 'name'
function getTermName(node, op) {
    var polyNode = new mathNode.PolynomialTerm(node);
    // we 'name' polynomial terms by their symbol name
    var termName = polyNode.getSymbolName();
    // when adding terms, the exponent matters too (e.g. 2x^2 + 5x^3 can't be combined)
    if (op === '+') {
        var exponent = print(polyNode.getExponentNode(true));
        termName += '^' + exponent;
    }
    return termName;
}
// Collects like terms in an addition expression tree into categories.
// Returns a dictionary of termname to lists of nodes with that name
// e.g. 2x + 4 + 5x would return {'x': [2x, 5x], CONSTANT: [4]}
// (where 2x, 5x, and 4 would actually be expression trees)
function getTermsForCollectingAddition(node) {
    var terms = {};
    for (var i = 0; i < node.args.length; i++) {
        var child = node.args[i];
        if (mathNode.PolynomialTerm.isPolynomialTerm(child)) {
            var termName = getTermName(child, '+');
            terms = Util.appendToArrayInObject(terms, termName, child);
        }
        else if (mathNode.Type.isIntegerFraction(child)) {
            terms = Util.appendToArrayInObject(terms, CONSTANT_FRACTION, child);
        }
        else if (mathNode.Type.isConstant(child)) {
            terms = Util.appendToArrayInObject(terms, CONSTANT, child);
        }
        else if (mathNode.Type.isOperator(node) ||
            mathNode.Type.isFunction(node) ||
            mathNode.Type.isParenthesis(node) ||
            mathNode.Type.isUnaryMinus(node)) {
            terms = Util.appendToArrayInObject(terms, OTHER, child);
        }
        else {
            // Note that we shouldn't get any symbol nodes in the switch statement
            // since they would have been handled by isPolynomialTerm
            throw Error('Unsupported node type: ' + child.type);
        }
    }
    // If there's exactly one constant and one fraction, we collect them
    // to add them together.
    // e.g. 2 + 1/3 + 5 would collect the constants (2+5) + 1/3
    // but 2 + 1/3 + x would collect (2 + 1/3) + x so we can add them together
    if (terms[CONSTANT] && terms[CONSTANT].length === 1 &&
        terms[CONSTANT_FRACTION] && terms[CONSTANT_FRACTION].length === 1) {
        var fraction = terms[CONSTANT_FRACTION][0];
        terms = Util.appendToArrayInObject(terms, CONSTANT, fraction);
        delete terms[CONSTANT_FRACTION];
    }
    return terms;
}
function getTermsForCollectingMultiplication(node) {
    var terms = {};
    for (var i = 0; i < node.args.length; i++) {
        var child = node.args[i];
        if (mathNode.Type.isUnaryMinus(child)) {
            terms = Util.appendToArrayInObject(terms, CONSTANT, mathNode.Creator.constant(-1));
            child = child.args[0];
        }
        if (mathNode.PolynomialTerm.isPolynomialTerm(child)) {
            terms = addToTermsforPolynomialMultiplication(terms, child);
        }
        else if (mathNode.Type.isIntegerFraction(child)) {
            terms = Util.appendToArrayInObject(terms, CONSTANT, child);
        }
        else if (mathNode.Type.isConstant(child)) {
            terms = Util.appendToArrayInObject(terms, CONSTANT, child);
        }
        else if (mathNode.Type.isOperator(node) ||
            mathNode.Type.isFunction(node) ||
            mathNode.Type.isParenthesis(node) ||
            mathNode.Type.isUnaryMinus(node)) {
            terms = Util.appendToArrayInObject(terms, OTHER, child);
        }
        else {
            // Note that we shouldn't get any symbol nodes in the switch statement
            // since they would have been handled by isPolynomialTerm
            throw Error('Unsupported node type: ' + child.type);
        }
    }
    return terms;
}
function addToTermsforPolynomialMultiplication(terms, node) {
    var polyNode = new mathNode.PolynomialTerm(node);
    var termName;
    if (!polyNode.hasCoeff()) {
        termName = getTermName(node, '*');
        terms = Util.appendToArrayInObject(terms, termName, node);
    }
    else {
        var coefficient = polyNode.getCoeffNode();
        var termWithoutCoefficient = polyNode.getSymbolNode();
        if (polyNode.getExponentNode()) {
            termWithoutCoefficient = mathNode.Creator.operator('^', [termWithoutCoefficient, polyNode.getExponentNode()]);
        }
        terms = Util.appendToArrayInObject(terms, CONSTANT, coefficient);
        termName = getTermName(termWithoutCoefficient, '*');
        terms = Util.appendToArrayInObject(terms, termName, termWithoutCoefficient);
    }
    return terms;
}
// Sort function for termnames. Sort first by symbol name, and then by exponent.
function sortTerms(a, b) {
    if (a === b) {
        return 0;
    }
    // if no exponent, sort alphabetically
    if (a.indexOf('^') === -1) {
        return a < b ? -1 : 1;
    }
    else {
        var symbA = a.split('^')[0];
        var expA = a.split('^')[1];
        var symbB = b.split('^')[0];
        var expB = b.split('^')[1];
        if (symbA !== symbB) {
            return symbA < symbB ? -1 : 1;
        }
        else {
            return expA > expB ? -1 : 1;
        }
    }
}
module.exports = LikeTermCollector;
//# sourceMappingURL=LikeTermCollector.js.map