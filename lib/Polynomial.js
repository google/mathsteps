import {parse, print} from 'math-parser';
import {build, query} from 'math-nodes';

const isPolynomial = (node) => {
    return query.isAdd(node) && node.args.every(isPolynomialTerm)
}

const isPolynomialTerm = (node) => {
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

const getCoefficient = (node) => {
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

const getVariable = (node) => {
    if (query.isIdentifier(node) || query.isPow(node)) {
        return node
    } else if (query.isMul(node)) {
        const variables = node.args.filter(
            node => query.isIdentifier(node) || query.isPow(node))

        if (variables.length > 1) {
            return build.applyNode('mul', variables, null, {implicit: true})
        } else {
            return variables[0]
        }
    } else if (query.isNeg(node)) {
        return getVariable(node.args[0])
    }
}

const getCoefficientsAndConstants = (node) => {
    const coefficientMap = {}
    const constants = []

    node.args.forEach(arg => {
        if (query.isNumber(arg)) {
            constants.push(arg)
        } else {
            const variable = getVariable(arg)
            const coefficient = getCoefficient(arg)

            // TODO: sort the factors
            const key = print(variable)

            if (!(key in coefficientMap)) {
                coefficientMap[key] = []
            }

            coefficientMap[key].push(coefficient)
        }
    })

    return {coefficientMap, constants}
}

export {
  isPolynomial,
  isPolynomialTerm,
  getCoefficient,
  getCoefficientsAndConstants,
  getVariable,
  isPolynomial
};
