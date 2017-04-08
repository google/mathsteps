"use strict";
var canAddLikeTermPolynomialNodes = require("./canAddLikeTermPolynomialNodes");
var canMultiplyLikeTermPolynomialNodes = require("./canMultiplyLikeTermPolynomialNodes");
var canRearrangeCoefficient = require("./canRearrangeCoefficient");
function canSimplifyPolynomialTerms(node) {
    return (canAddLikeTermPolynomialNodes(node) ||
        canMultiplyLikeTermPolynomialNodes(node) ||
        canRearrangeCoefficient(node));
}
module.exports = canSimplifyPolynomialTerms;
//# sourceMappingURL=canSimplifyPolynomialTerms.js.map