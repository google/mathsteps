const Node = require('../../node')
const TreeSearch = require('../../TreeSearch')

const reduce                   = require('./reduce')
const multiplyShortFormulas    = require('./multiplyShortFormulas')
const addLikeTerms             = require('./addLikeTerms')
const sqrtMultiplication       = require('./sqrtMultiplication')
const sqrtFromOne              = require('./sqrtFromOne')
const sqrtFromPow              = require('./sqrtFromPow')
const sqrtFromConstant         = require('./sqrtFromConstant')
const powFactors               = require('./powFactors')
const powFraction              = require('./powFraction')
const removeUnnededParenthesis = require('./removeUnnededParenthesis')
const powOfPow                 = require('./powOfPow')
const powOfSqrt                = require('./powOfSqrt')
const powToNegativeExponent    = require('./powToNegativeExponent')
const commonFunctions          = require('./commonFunctions')
const removeDoubleFraction     = require('./removeDoubleFraction')
const simplifyDoubleUnaryMinus = require('./simplifyDoubleUnaryMinus')
const removeFractionWithUnitNumerator = require('./removeFractionWithUnitNumerator')

const SIMPLIFICATION_FUNCTIONS = [
  // x^-1 gives 1/x
  powToNegativeExponent,

  // sqrt(x)*sqrt(x) gives x
  sqrtMultiplication,

  // sqrt(1) gives 1
  sqrtFromOne,

  // sqrt(x^2) gives x or |x| (depends on domain)
  sqrtFromPow,

  // sqrt(n) - calculate if possible.
  sqrtFromConstant,

  // (a*b)^x gives a^x + b^x
  powFactors,

  // (a/b)^x gives a^x/b^x
  powFraction,

  // (x*y*z)*(a*b*c) gives x*y*z*a*b*c
  // x*(a*b*c) gives x*a*b*c
  // (a*b*c)*x gives a*b*c*x
  // a*(b/c) gives a*b/c
  // (a/b)*c gives a/b*c
  removeUnnededParenthesis,

  // (x^a)^b gives x^(a*b)
  powOfPow,

  // sqrt(x)^2 gives x
  // sqrt(x)^b gives x^(b/2)
  powOfSqrt,

  // a * 1/x gives a/x
  removeFractionWithUnitNumerator,

  // (x/y)/z gives x/(y*z)
  removeDoubleFraction,

  // - (a -b c) gives (a b c)
  simplifyDoubleUnaryMinus,

  // x y + x y gives 2 x y
  // Possible improvement: integrate with original mathsteps code
  addLikeTerms,

  // common function simplification e.g. sin(0) gives 0
  commonFunctions,

  // x*a/x gives a
  reduce,

  // (a + b)^2 gives a^2 + 2ab + b^2 etc.
  multiplyShortFormulas,
]

const search = TreeSearch.preOrder(basics)

// Look for kemu step(s) to perform on a node. Returns a Node.Status object.
function basics(node, expressionCtx) {
  for (let i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
    const nodeStatus = SIMPLIFICATION_FUNCTIONS[i](node, expressionCtx)
    if (nodeStatus.hasChanged()) {
      return nodeStatus
    } else {
      node = nodeStatus.newNode
    }
  }
  return Node.Status.noChange(node)
}

module.exports = search
