const clone = require('../../util/clone');
const {apply} = require('../../apply');
const ChangeTypes = require('../../ChangeTypes');
const {flattenOperands, canApplyRule, defineRule} = require('math-rules');
const {build, query} = require('math-nodes');
const {parse, print} = require('math-parser');
const {traverse} = require('math-traverse');
const Node = require('../../node');

const LikeTermCollector = {};

LikeTermCollector.collectLikeTerms = function(node) {
  let newNode = clone(node)
  let status = apply(newNode, COLLECT_LIKE_TERMS, ChangeTypes.COLLECT_LIKE_TERMS);

  if (!status.hasChanged()) {
    status = apply(newNode, MULTIPLY_COEFFICIENTS, ChangeTypes.MULTIPLY_COEFFICIENTS);
  }

  newNode = Node.Status.resetChangeGroups(status.newNode);

  if (status.hasChanged()) {
    return Node.Status.nodeChanged(
      ChangeTypes.COLLECT_LIKE_TERMS, node, newNode, false);
  } else {
    return Node.Status.noChange(node);
  }
}

const COLLECT_LIKE_TERMS = defineRule(
  (node) => {
    /*
      Check if expression contains like termsi
      Either there are > 1 constant terms (e.g. 2 + 3 + x)
      Or there are > 1 polynomial terms with the same base and exponent
    */
    let hasLikeTerms = false
    if (query.isPolynomial(node) && query.isAdd(node)) {
      const {coefficientMap, constants, others} = query.getCoefficientsAndConstants(node)
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
    const {coefficientMap, constants, others} = query.getCoefficientsAndConstants(node)

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

// e.g. 3x^2 * 2x^2 -> (3 * 2)(x^2 * x^2)
const MULTIPLY_COEFFICIENTS = defineRule(
  (node) => {
    let isMulOfPolynomials = false
    
    if (query.isMul(node)) {
      const {coefficientMap, constants} = query.getCoefficientsAndConstants(node)
      isMulOfPolynomials = Object.keys(coefficientMap).length > 1
        || Object.keys(coefficientMap)
        .some(key => coefficientMap[key].length > 1)
    }

    return (isMulOfPolynomials && !node.implicit) ? {node} : null
  }, 
  (node) => {
      const terms = query.getVariableFactors(node)
    const coeffs = []
   
    node.args.forEach(function(arg) {
      if (query.getValue(query.getCoefficient(arg)) != 1) {
        coeffs.push(query.getCoefficient(arg))
      }
    })

    let poly = build.mul(...terms)

    const result =  coeffs.length > 1
      ? build.implicitMul(build.mul(...coeffs), poly)
      : coeffs.length == 1
      ? build.implicitMul(coeffs[0], poly)
      : poly

    return result
  }
)

module.exports = LikeTermCollector;
