const arithmeticSearch = require('../arithmeticSearch');
const {apply} = require('../../apply');
const clone = require('../../util/clone');
const ChangeTypes = require('../../ChangeTypes');
const evaluate = require('math-evaluator').default;
const {flattenOperands, canApplyRule, applyRule, defineRule, rewriteNode, definePatternRule} = require('math-rules');
const {build, query} = require('math-nodes');
const {parse, print} = require('math-parser');
const {traverse} = require('math-traverse');
const Node = require('../../node');

const defineRuleString = (matchPattern, rewritePattern, constraints) => {
  const matchAST = parse(matchPattern)
  const rewriteAST = parse(rewritePattern)

  traverse(matchAST, {
    leave(node) {
      delete node.loc
    }
  })

  traverse(rewriteAST, {
    leave(node) {
      delete node.loc
    }
  })

  return definePatternRule(matchAST, rewriteAST, constraints)
}

// EXPONENT RULES

// e.g. x^2 * x -> x^2 * x^1
const ADD_EXPONENT_OF_ONE = defineRule(
  (node) => {
    let hasIdentifier = false
    if (query.isMul(node)) {
      for (var i in node.args) {
        let term = node.args[i]
        // return if there is a variable with exponent = 1
        if (query.getValue(query.getPolyDegree(term)) == 1 || query.isNumber(term)) {
          return {node}
        }
      }
    }
    return null
  },

  (node) => {
    const result = build.apply(
      'mul',
      node.args.map(term => {
        let one = build.number(1)
        if (query.isMul(term)) {
          return build.implicitMul(...term.args.map(arg=> {
            if (query.isIdentifier(arg)) {
              return build.pow(arg, one)
            } else {
              return arg
            }
          }))
        } else if (query.isIdentifier(term) || query.isNumber(term)) {
          return build.pow(term, one)
        } else {
          return term
        }
      }), {implicit: false}
    )
    return result
  }
)

// e.g. x^5 * x^3 -> x^(5 + 3)
const PRODUCT_RULE = defineRuleString('#a^#b_0 * ...', '#a^(#b_0 + ...)')

// e.g. x^5 / x^3 -> x^(5 - 3)
const QUOTIENT_RULE = defineRuleString('#a^#p / #a^#q', '#a^(#p - #q)')

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
    const terms = []
    const coeffs = []
    traverse(node, {
      enter(node) {
        if(query.isPow(node)){
          terms.push(node)
        }
      }
    })
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

// e.g. (3 * 2)(x^3 y^2) -> 6 x^3 y^2
const SIMPLIFY_COEFFICIENTS = defineRuleString(
  '(#a_0 * ...) #b', '#eval(#a_0 * ...) #b'
)

function multiplyLikeTerms(node) {
  let status
  /*status = apply(node, MULTIPLY_COEFFICIENTS, ChangeTypes.MULTIPLY_COEFFICIENTS)
  console.log(status)
  if (status.hasChanged()) {
    status.changeType = ChangeTypes.MULTIPLY_COEFFICIENTS;
    return status;
  }*/
  status = multiplyPolynomialTerms(node);

  if (status.hasChanged()) {
    status.changeType = ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS;
    return status;
  }

  return Node.Status.noChange(node);
}

function multiplyPolynomialTerms(node) {
  let newNode = clone(node);
  let substeps = [];

  // STEP 1: If any term has no exponent, make it have exponent 1
  // e.g. x -> x^1 (this is for pedagogy reasons)
  let status = apply(newNode, ADD_EXPONENT_OF_ONE, ChangeTypes.ADD_EXPONENT_OF_ONE);

  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  status = apply(newNode, MULTIPLY_COEFFICIENTS, ChangeTypes.MULTIPLY_COEFFICIENTS);

  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  // STEP 2: collect exponents to a single exponent sum and evaluate sum
  // e.g. x^1 * x^3 -> x^(1+3) -> x^4
  status = apply(newNode, PRODUCT_RULE, ChangeTypes.PRODUCT_RULE);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  if(!status.hasChanged()) {
    return Node.Status.noChange(node);
  }

  // STEP 3: add exponents together.
  // NOTE: This might not be a step if the exponents aren't all constants,
  // but this case isn't that common and can be caught in other steps.
  // e.g. x^(2+4+z)
  // TODO: handle fractions, combining and collecting like terms, etc, here
  const exponentSum = newNode.args[1];
  const sumStatus = arithmeticSearch(exponentSum);
  if (sumStatus.hasChanged()) {
    status = Node.Status.childChanged(newNode, sumStatus, 1);
    substeps.push(status);
    newNode = Node.Status.resetChangeGroups(status.newNode);
  }

  if (substeps.length === 1) { // possible if only step 2 happens
    return substeps[0];
  }
  else {
    return Node.Status.nodeChanged(
      ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS,
      node, newNode, true, substeps);
  }
}

module.exports = {multiplyLikeTerms}
