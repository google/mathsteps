// Possible improvement: move simplifyCore.js to better place?
const simplifyCore = require('../simplifyExpression/kemuCommonSearch/simplifyCore.js')
const ChangeTypes = require('../ChangeTypes')
const Node = require('../node')

const poolOfRules = [
  {l: 'n1^2    - c1' , r: '(n1 + nthRoot(c1,2)) (n1 - nthRoot(c1, 2))'       , id: ChangeTypes.FACTOR_SYMBOL},
  {l: 'c1*n1^2 - c2' , r: '(n1 + nthRoot(c2/c1,2)) (n1 - nthRoot(c2/c1, 2))' , id: ChangeTypes.FACTOR_SYMBOL},
  {l: 'n1^3 - c1'    , r: '(x - nthRoot(c1, 3))^3'                           , id: ChangeTypes.FACTOR_SYMBOL},
  {l: 'c1*n1^3 - c2' , r: '(x - nthRoot(c2/c1, 3))^3'                        , id: ChangeTypes.FACTOR_SYMBOL},
]

function factorCommon(node) {
//  console.log('FACTORING...', node.toString())

  let rv = Node.Status.noChange(node)


  // Possible improvement: catch many steps at once.
  const steps = simplifyCore(node, poolOfRules, null, {stopOnFirstStep: true})

  if (steps.length > 0) {
    const oneStep = steps[0]
    rv = Node.Status.nodeChanged(
      oneStep.ruleApplied.id,  node, oneStep.nodeAfter)
  }

  return rv
}

module.exports = factorCommon
