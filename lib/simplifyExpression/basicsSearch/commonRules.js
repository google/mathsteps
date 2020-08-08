const simplifyCore = require('./../kemuCommonSearch/simplifyCore.js')
const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

const poolOfRules = [
  // Power.
  {l: 'n^0' , r: '1' , id: ChangeTypes.REDUCE_EXPONENT_BY_ZERO},
  {l: 'n^1' , r: 'n' , id: ChangeTypes.REMOVE_EXPONENT_BY_ONE},
  {l: '0^n' , r: '0' , id: ChangeTypes.REMOVE_EXPONENT_BASE_ZERO},
  {l: '1^n' , r: '1' , id: ChangeTypes.REMOVE_EXPONENT_BASE_ONE},

  // Multiply.
  {l: '0*n' , r: '0' , id: ChangeTypes.MULTIPLY_BY_ZERO},
  {l: 'n*0' , r: '0' , id: ChangeTypes.MULTIPLY_BY_ZERO},

  // Other.
  {l: 'c1/c2 * v1/c3' , r: 'c1 / (c2*c3) * v1' , id: ChangeTypes.REARRANGE_COEFF},
]

function applyRules(node) {
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

module.exports = applyRules
