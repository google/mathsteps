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

const getRanges = (args, predicate) => {
  const ranges = [];
  let i;
  let start = -1;
  for (i = 0; i < args.length; i++) {
    if (predicate(args[i])) {
      if (start === -1) {
        start = i;
      }
    }
    else {
      if (start !== -1 && i - start > 1) {
        ranges.push([start, i]);
      }
      start = -1;
    }
  }
  if (start !== -1 && i - start > 1) {
    ranges.push([start, i]);
  }
  return ranges;
};

// ARITHMETIC

// e.g. 2 + 2 -> 4 or 2 * 2 -> 4
// TODO(kevinb): handle fractions
const SIMPLIFY_ARITHMETIC = defineRule(
  node => {
    if (query.isOperation(node)) {
      if (query.isAdd(node) || query.isMul(node)) {
        if (node.args.every(query.isNumber)) {
          return {node};
        }
        else {
          const ranges = getRanges(node.args, query.isNumber);
          if (ranges.length > 0) {
            // For now we're only using the first range, but we'll
            // want to use all ranges when we're applying a rule
            // multiple times in the future.
            const indexes = {
              start: ranges[0][0],
              end: ranges[0][1],
            };
            return {node, indexes};
          }
        }
      }
      else if (node.args.every(query.isNumber)) {
        return {node};
      }
    }
    return null;
  },
  // TODO: replace this with '#eval(#a)'
  (node, _, indexes) => {
    const copy = clone(node);
    if (indexes) {
      copy.args = copy.args.slice(indexes.start, indexes.end);
    }
    return parse(String(evaluate(copy)));
  }
);

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

// EXPONENT RULES

// e.g. x^2 * x -> x^2 * x^1
const ADD_EXPONENT_OF_ONE = defineRule(
  (node) => {
    let hasIdentifier = false
    if (query.isMul(node)) {
      for (var i in node.args) {
        let term = node.args[i]
        // check if there is a variable with exponent 1
        hasIdentifier = query.isMul(term)
          ? term.some(arg => {return query.isIdentifier(arg)})
        : query.isIdentifier(term)
      }
    }

    return hasIdentifier ? {node} : null
  },

  (node) => {
    const result = build.apply(
      'mul',
      node.args.map(term => {
        let one = build.number(1)
        if (query.isMul(term)) {
          term.args(arg => {
            if (query.isIdentifier(arg)){
              return build.pow(term, one)
            } else {
              return arg
            }
          })
        } else if (query.isIdentifier(term)) {
          return build.pow(term, one)
        } else {
          return term
        }
      }), {implicit: node.implicit}
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
      const {constants, coefficientMap} = getCoefficientsAndConstants(node)
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
      if (query.getValue(getCoefficient(arg)) != 1) {
        coeffs.push(getCoefficient(arg))
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

// e.g. x^3 * x^2 * y^2 -> x^5 * y^2
const MULTIPLY_POLYNOMIAL_TERMS = defineRule(
  (node) => {
    let coefficientOfOne = false
    if(query.isMul(node)){
      coefficientOfOne = node.args.every(term => {
        return isPolynomialTerm(term)
          && query.getValue(getCoefficient(term)) == 1
      })
    }

    return coefficientOfOne ? {node} : null
  },

  (node) => {
    let result = node
    while(canApplyRule(PRODUCT_RULE, result)) {
      result = applyRule(PRODUCT_RULE, result)
    }
    while(canApplyRule(SIMPLIFY_ARITHMETIC, result)) {
      result = applyRule(SIMPLIFY_ARITHMETIC, result)
    }
    return query.isMul(result)
      ? build.implicitMul(...result.args)
    : result
  }
)

// e.g. (3 * 2)(x^3 y^2) -> 6 x^3 y^2
const SIMPLIFY_COEFFICIENTS = defineRuleString(
  '(#a_0 * ...) #b', '#eval(#a_0 * ...) #b'
)

/*
function multiplyLikeTerms(node) {
  // ARITHMETICSEARCH
  // MULTIPLYFRACTIONSEARCH
  let status = multiplyPolynomialTerms(node);
  if (status.hasChanged()) {
    status.changeType = ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS;
    return status;
  }

  return Node.Status.noChange(node);
}
*/

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
  // STEP 2: collect exponents to a single exponent sum and evaluate sum
  // e.g. x^1 * x^3 -> x^(1+3) -> x^4
  status = apply(newNode, MULTIPLY_POLYNOMIAL_TERMS, ChangeTypes.MULTIPLY_POLYNOMIAL_TERMS);
  substeps.push(status);
  newNode = Node.Status.resetChangeGroups(status.newNode);

  if(!status) {
    return Node.Status.noChange(node);
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

module.exports = {multiplyPolynomialTerms}
