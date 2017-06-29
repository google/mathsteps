const clone = require('../../util/clone');
const {flattenOperands, canApplyRule, defineRule} = require('math-rules');
const {build, query} = require('math-nodes');
const {parse, print} = require('math-parser');

export const isPolynomialTerm = (node) => {
    if (query.isNumber(node)) {
        return true
    } else if (query.isIdentifier(node)) {
        return true
    } else if (query.isPow(node)) {
        const [base, exponent] = node.args
        return query.isIdentifier(base) && isPolynomialTerm(exponent)
    } else if (query.isNeg(node)) {
        return isPolynomialTerm(node.args[0])
    } else if (query.isMul(node)) {
        return node.args.every(isPolynomialTerm)
    }
}

// TODO: handle multivariable polynomials
// Get degree of a polynomial term
// e.g. 6x^2 -> 2
const getExponent = (node) => {
    if (query.isNumber(node)) {
        return 0
    } else if (query.isIdentifier(node)){
        return 1
    } else if (query.isPow(node)) {
        return query.getValue(node.args[1])
    } else if (query.isMul(node)){
        return getExponent(node.args[1])
    } else if (query.isNeg(node)) {
        const variable = node.args[0]
        return getExponent(variable.args[1])
    } else {
        return null
    }
}

// TODO: handle multivariable polynomials
// e.g. 2 + 3x^2 + 3x - 4x^3 -> -4x^3 + 3x^2 + 3x + 2
export const REARRANGE_TERMS = defineRule(
    (node) => {
        if (query.isAdd(node)) {
            return node.args.some(arg => {
                return isPolynomialTerm(arg)
            }) ? {node} : null
        }
    },

    (node) => {
        const ordered = node.args.sort(function(a,b) {return getExponent(b) - getExponent(a)})
        return build.add(...ordered)
    }
)

module.exports = {REARRANGE_TERMS}
