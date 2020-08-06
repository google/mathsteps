const simplifyCore = require('./simplifyCore.js')
const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

const poolOfRules = [
  // Common sin(x) values.
  {l: 'sin(0)'    , r: '0'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'sin(pi/6)' , r: '1/2'       , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'sin(pi/4)' , r: 'sqrt(2)/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'sin(pi/3)' , r: 'sqrt(3)/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'sin(pi/2)' , r: '1'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'sin(pi)'   , r: '0'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common asin(x) values.
  {l: 'asin(0)'         , r: '0'    , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'asin(1/2)'       , r: 'pi/6' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'asin(sqrt(2)/2)' , r: 'pi/4' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'asin(sqrt(3)/2)' , r: 'pi/3' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'asin(1)'         , r: 'pi/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'asin(0)'         , r: 'pi'   , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common cos(x) values.
  {l: 'cos(0)'    , r: '1'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'cos(pi/6)' , r: 'sqrt(3)/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'cos(pi/4)' , r: 'sqrt(2)/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'cos(pi/3)' , r: '1/2'       , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'cos(pi/2)' , r: '0'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'cos(pi)'   , r: '-1'        , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common acos(x) values.
  {l: 'acos(1)'         , r: '0'    , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acos(sqrt(3)/2)' , r: 'pi/6' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acos(sqrt(2)/2)' , r: 'pi/4' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acos(1/2)'       , r: 'pi/3' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acos(0)'         , r: 'pi/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acos(-1)'        , r: 'pi'   , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common tg(x) values.
  {l: 'tg(0)'     , r: '0'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'tg(pi/6)'  , r: 'sqrt(3)/3' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'tg(pi/4)'  , r: '1'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'tg(pi/3)'  , r: 'sqrt(3)'   , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common arctg(x) values.
  {l: 'atan(0)'         , r: '0'    , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'atan(sqrt(3)/3)' , r: 'pi/6' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'atan(1)'         , r: 'pi/4' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'atan(sqrt(3))'   , r: 'pi/3' , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common ctg(x) values.
  {l: 'ctg(pi/6)' , r: 'sqrt(3)'   , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'ctg(pi/4)' , r: '1'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'ctg(pi/3)' , r: 'sqrt(3)/3' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'ctg(pi/2)' , r: '0'         , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common arcctg(x) values.
  {l: 'acot(sqrt(3))'   , r: 'pi/6' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acot(1)'         , r: 'pi/4' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acot(sqrt(3)/3)' , r: 'pi/3' , id: ChangeTypes.KEMU_FUNCTION_VALUE},
  {l: 'acot(0)'         , r: 'pi/2' , id: ChangeTypes.KEMU_FUNCTION_VALUE},

  // Common laws for trigonometry functions.
  {l: 'sin(n1)^2 + cos(n1)^2' , r: '1'            , id: ChangeTypes.KEMU_PYTHAGOREAN_IDENTITY},
  {l: 'sin(-n)'               , r: '-sin(n)'      , id: ChangeTypes.KEMU_ODD_FUNCTION_OF_NEGATIVE},
  {l: 'sin(-n1/n2)'           , r: '-sin(n1/n2)'  , id: ChangeTypes.KEMU_ODD_FUNCTION_OF_NEGATIVE},
  {l: 'cos(-n)'               , r: 'cos(n)'       , id: ChangeTypes.KEMU_EVEN_FUNCTION_OF_NEGATIVE},
  {l: 'cos(-n1/n2)'           , r: 'cos(n1/n2)'   , id: ChangeTypes.KEMU_EVEN_FUNCTION_OF_NEGATIVE},
  {l: 'tg(-n)'                , r: '-tg(n)'       , id: ChangeTypes.KEMU_ODD_FUNCTION_OF_NEGATIVE},
  {l: 'tg(-n1/n2)'            , r: '-tg(n1/n2)'   , id: ChangeTypes.KEMU_ODD_FUNCTION_OF_NEGATIVE},
  {l: 'ctg(-n)'               , r: '-ctg(n)'      , id: ChangeTypes.KEMU_ODD_FUNCTION_OF_NEGATIVE},
  {l: 'ctg(-n1/n2)'           , r: '-ctg(n1/n2)'  , id: ChangeTypes.KEMU_ODD_FUNCTION_OF_NEGATIVE},
  {l: 'atan(sin(n)/cos(n))'   , r: 'atan(tg(n))'  , id: ChangeTypes.KEMU_CONVERT_SIN_PER_COS_TO_TAN},
  {l: 'acot(cos(n)/sin(n))'   , r: 'acot(ctg(n))' , id: ChangeTypes.KEMU_CONVERT_COS_PER_SIN_TO_COT},
  {l: 'atan(tg(n))'           , r: 'n'            , id: ChangeTypes.KEMU_CANCEL_INVERSE_FUNCTION},
  {l: 'acot(ctg(n))'          , r: 'n'            , id: ChangeTypes.KEMU_CANCEL_INVERSE_FUNCTION},
  {l: 'asin(sin(n))'          , r: 'n'            , id: ChangeTypes.KEMU_CANCEL_INVERSE_FUNCTION},
  {l: 'acos(cos(n))'          , r: 'n'            , id: ChangeTypes.KEMU_CANCEL_INVERSE_FUNCTION},

  // Common fraction rules.
  {l: 'c1/n3 + c2/n3' , r: '(c1 + c2) / n3' , id: ChangeTypes.ADD_FRACTIONS},

  // Common sqrt values.
  // More complex arguments are handled in sqrtFromConst extension.
  {l: 'sqrt(0)' , r: '0' , id: ChangeTypes.KEMU_SQRT_FROM_ZERO},
  {l: 'sqrt(1)' , r: '1' , id: ChangeTypes.KEMU_SQRT_FROM_ONE},

  // Common n-th root values.
  {l: 'nthRoot(0, n1)' , r: '0' , id: ChangeTypes.KEMU_SQRT_FROM_ZERO},
  {l: 'nthRoot(1, n1)' , r: '1' , id: ChangeTypes.KEMU_SQRT_FROM_ONE},

  // Common n-th root rules.
  {l: 'nthRoot(n1^n2, n3)' , r: 'n1^(n2/n3)' , id: ChangeTypes.KEMU_SQRT_FROM_POW},
  {l: 'nthRoot(n1, n2)^n3' , r: 'n1^(n3/n2)' , id: ChangeTypes.KEMU_POWER_SQRT},

  // Common power rules.
  {l: 'n1^n2 * n1^n3' , r: 'n1^(n2+n3)'     , id: ChangeTypes.KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE},
  {l: 'n1^n2 - n1^n3' , r: 'n1^(n2-n3)'     , id: ChangeTypes.KEMU_DIVIDE_POWERS_WITH_COMMON_BASE},

  // Negative exponents:
  // x^-a gives 1/x^a
  {l: '(n1/n2)^(-1)'  , r: 'n2/n1'          , id: ChangeTypes.KEMU_POWER_TO_MINUS_ONE},
  {l: 'n1^(-1)'       , r: '1/n1'           , id: ChangeTypes.KEMU_POWER_TO_MINUS_ONE},
  {l: 'n1^(-n2)'      , r: '1/(n1^n2)'      , id: ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT},
  {l: 'n1^(-n2/n3)'   , r: '1/(n1^(n2/n3))' , id: ChangeTypes.KEMU_POWER_TO_NEGATIVE_EXPONENT},

  // Calculate constant power.
  {l: 'c1^(c2/c3)' , r: 'nthRoot(c1^c2, c3)' , id: ChangeTypes.KEMU_CONVERT_POWER_TO_ROOT},

  // Common power-root rules.
  {l: 'n1 * nthRoot(n1,n2)' , r: 'n1 * n1^(1/n2)' , id: ChangeTypes.KEMU_CONVERT_ROOT_TO_POWER},
]

function commonFunctions(node) {
  let rv = Node.Status.noChange(node)

  // Possible improvement: catch many steps at once.
  const steps = simplifyCore(node, poolOfRules, null, {stopOnFirstStep: true})

  if (steps.length > 0) {
    const oneStep = steps[0]
    rv = Node.Status.nodeChanged(
      oneStep.ruleApplied.id,  node, oneStep.nodeAfter)

    // Post process rules.
    switch (oneStep.ruleApplied.id) {
      case ChangeTypes.KEMU_MULTIPLY_POWERS_WITH_COMMON_BASE:
      case ChangeTypes.KEMU_DIVIDE_POWERS_WITH_COMMON_BASE: {
        // Make sure there is parenthesis around complex base: (...)^n
        oneStep.nodeAfter.args[0] = Node.Creator.parenthesis(oneStep.nodeAfter.args[0])
        break
      }
    }
  }

  return rv
}

module.exports = commonFunctions
