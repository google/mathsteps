const clone = require('../../util/clone');
const {flattenOperands, canApplyRule, defineRule} = require('math-rules');
const {build, query} = require('math-nodes');
const {parse, print} = require('math-parser');

const isPolynomial = (node) => {
    return query.isAdd(node) && node.args.every(isPolynomialTerm)
}

// x, 2x, xy, 2xy, x^2, ...
// isFactor matches x, 2, x^2
// match either #x, #x^#b, or #a where #x is an identifier and #b and #a are numbers
// but really we want #b to match either a number or a fraction with numbers for
// numerator and denominator

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

export const getCoefficient = (node) => {
    if (query.isNumber(node)) {
        return node
    } else if (query.isIdentifier(node) || query.isPow(node)) {
        return build.numberNode(1)
    } else if (query.isNeg(node)) {
        const result = build.applyNode('neg', [getCoefficient(node.args[0])])
        result.wasMinus = node.wasMinus
        return result
    } else if (query.isMul(node)) {
        const numbers = node.args.filter(query.isNumber)
        if (numbers.length > 1) {
            return build.applyNode('mul', numbers)
        } else if (numbers.length > 0) {
            return numbers[0]
        } else {
            return build.numberNode(1)
        }
    }
}

export const isVariableFactor = (node) =>
    query.isIdentifier(node) ||
    query.isPow(node) && query.isIdentifier(node.args[0]) &&
    (query.isNumber(node.args[1]) || isVariableFactor(node.args[1]))


export const getVariableFactors = (node) => {
    if (isVariableFactor(node)) {
        return [node]
    } else if (query.isMul(node)) {
        return node.args.filter(isVariableFactor)
    } else if (query.isNeg(node)) {
        // TODO: figure out how to handle (x)(-y)(z)
        return getVariableFactors(node.args[0])
    } else {
        // throw?
    }
}

const getVariableFactorName = (node) => {
    if (query.isIdentifier(node)) {
        return node.name
    } else if (query.isPow(node)) {
        return getVariableFactorName(node.args[0])
    } else {
        // throw?
    }
}

const sortVariables = (variables) =>
    variables.sort(
        (a, b) => getVariableFactorName(a) > getVariableFactorName(b))

const isImplicit = (node) => {
    if (query.isMul(node)) {
        return node.implicit
    } else if (query.isNeg(node)) {
        return isImplicit(node.args[0])
    } else {
        return false
    }
}

const getCoefficientsAndConstants = (node) => {
    const coefficientMap = {}
    const constants = []

    node.args.forEach(arg => {
        if (query.isNumber(arg)) {
            constants.push(arg)
        } else {
            const sortedVariables = sortVariables(getVariableFactors(arg))

            const coefficient = getCoefficient(arg)
            const implicit = isImplicit(arg)

            const key = sortedVariables.length > 1
                ? print(build.applyNode('mul', sortedVariables, {implicit}))
            : print(sortedVariables[0])

            if (!(key in coefficientMap)) {
                coefficientMap[key] = []
            }

            coefficientMap[key].push(coefficient)
        }
    })

    return {coefficientMap, constants}
}

export const ADD_POLYNOMIAL_TERMS = defineRule(
    // MATCH FUNCTION
    (node) => {
        let hasLikeTerms = false

        if (isPolynomial(node)) {

            // e.g 2x + 2x + 4 + 6
            // coefficient map: {'x': [[2 node] [2 node]}
            // constants: [[4 node] [6 node]]
            const {constants, coefficientMap} = getCoefficientsAndConstants(node)

            // checks if at least one key has more than 1
            // coefficient term
            hasLikeTerms = Object.keys(coefficientMap)
                .some(key => coefficientMap[key].length > 1)
        }
        return hasLikeTerms ? {node} : null
    },


    // REWRITE FUNCTION
    (node) => {
        const {constants, coefficientMap} = getCoefficientsAndConstants(node)

        // Use example: 2x + 3x + 4
        // for each identifier, generate the simplified term
        // e.g 2x + 3x -> 5x
        const terms = Object.keys(coefficientMap).sort().map(key => {
            // [[2 node], [3 node]]
            const coeffs = coefficientMap[key]
            // x
            const variable = parse(key)

            // 5
            const newCoeff =
                  coeffs.reduce((runningTotal, value) =>
                                runningTotal + query.getValue(value), 0)

            // [[5 node]]
            const newCoeffNode = build.number(newCoeff)

            // [[5x node]]
            const term = build.implicitMul(clone(newCoeffNode), clone(variable))

            return flattenOperands(term)
        })

        // One gigantic applyNode
        const result = terms.length > 1
              ? build.add(...terms)
              : terms[0]

        // Adding the constants if there are any
        if (constants.length > 1) {
            result.args.push(build.add(...constants))
        } else if (constants.length > 0) {
            result.args.push(constants[0])
        }

        return result
    }
)


module.exports = {ADD_POLYNOMIAL_TERMS} 
