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

const isPolynomialTerm = (node) => {
  if (query.isNumber(node) || query.isFraction(node) || query.isDecimal(node)) {
    return true
  } else if (query.isIdentifier(node)) {
    return true
  } else if (query.isPow(node)) {
    const [base, exponent] = node.args
    return isPolynomialTerm(base) || isPolynomialTerm(exponent)
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

const isVariableFactor = (node) =>
  query.isIdentifier(node) ||
  query.isPow(node) && query.isIdentifier(node.args[0]) &&
      (query.isNumber(node.args[1]) || isVariableFactor(node.args[1]))


const getVariableFactors = (node) => {
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

const isFraction = node => query.isNeg(node) ? isFraction(node.args[0]) : query.isDiv(node)
const isDecimal = node => query.isNumber(node) && query.getValue(node) % 1 != 0
const isConstantFraction = node => isFraction(node) && node.args.every(query.isNumber)

const hasConstantBase = node => query.isPow(node) && query.isNumber(node.args[0])

const getCoefficientsAndConstants = (node, coefficientMap = {}, constants = [], others = []) => {
  if (query.isNumber(node) || isConstantFraction(node)) {
    constants.push(node)
  } else if(isPolynomialTerm(node) && !hasConstantBase(node)) {
    const sortedVariables = sortVariables(getVariableFactors(node))

    const coefficient = getCoefficient(node)
    const implicit = isImplicit(node)
    const key = sortedVariables.length > 1
      ? print(build.applyNode('mul', sortedVariables, {implicit}))
    : print(sortedVariables[0])

    if (!(key in coefficientMap)) {
      coefficientMap[key] = [coefficient]
    } else {
      coefficientMap[key].push(coefficient)
    }
  } else if(isPolynomial(node)) {
    node.args.forEach(function(arg) {
      getCoefficientsAndConstants(arg, coefficientMap, constants, others)
    })
  } else {
    others.push(node)
  }

  return {coefficientMap, constants, others}
}

const COLLECT_LIKE_TERMS = defineRule(
  (node) => {
    /*
      Check if expression contains like termsi
      Either there are > 1 constant terms (e.g. 2 + 3 + x)
      Or there are > 1 polynomial terms with the same base and exponent
    */
    let hasLikeTerms = false
    if (isPolynomial(node)) {
      const {coefficientMap, constants, others} = getCoefficientsAndConstants(node)
      if (constants.length > 1) {
        hasLikeTerms = Object.keys(coefficientMap)
          .some(key => coefficientMap[key].length >= 1)
      } else if (constants.length == 1){
        hasLikeTerms = Object.keys(coefficientMap)
          .some(key => coefficientMap[key].length > 1)
      } else {
        hasLikeTerms = Object.keys(coefficientMap)
          .some(key => coefficientMap[key].length > 1)
          && Object.keys(coefficientMap).length > 1
      }
    }
    return hasLikeTerms ? {node} : null
  },

  (node) => {
    // should we match 2x + 4x
    const {coefficientMap, constants, others} = getCoefficientsAndConstants(node)

    const result = build.add(
      ...Object.keys(coefficientMap).sort().map(key => {
        const coeffs = coefficientMap[key]
        const variable = parse(key)

        const terms = coeffs.map(coeff => {
          if (query.getValue(coeff) === 1) {
            return clone(variable)
          } else if (query.getValue(coeff) === -1) {
            return build.neg(...[clone(variable)],
                             {wasMinus: coeff.wasMinus})
          } else {
            const variables = query.isMul(variable)
              ? variable.args.map(clone)
              : [clone(variable)]
            if (coeff.wasMinus) {
              return build.neg(...[
                build.implicitMul(...[clone(coeff.args[0]),...variables,])
              ], {wasMinus: true})
            } else {
              return build.implicitMul(...[clone(coeff), ...variables,])
            }
          }
        })

        return terms.length > 1 ? build.add(...terms) : terms[0]
      }))

    if (constants.length > 1) {
      result.args.push(build.add(...constants))
    } else if (constants.length > 0) {
      result.args.push(constants[0])
    }

    if (others.length > 1) {
      result.args.push(build.add(...others))
    } else if (others.length > 0) {
      result.args.push(others[0])
    }

    return result
  }
)

module.exports = {COLLECT_LIKE_TERMS}
