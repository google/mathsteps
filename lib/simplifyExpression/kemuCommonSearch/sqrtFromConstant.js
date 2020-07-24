const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')

const sqrtLUT = {
  '4': [ 2, 0 ],
  '8': [ 2, 2 ],
  '9': [ 3, 0 ],
  '12': [ 2, 3 ],
  '16': [ 4, 0 ],
  '18': [ 3, 2 ],
  '20': [ 2, 5 ],
  '25': [ 5, 0 ],
  '27': [ 3, 3 ],
  '28': [ 2, 7 ],
  '32': [ 4, 2 ],
  '36': [ 6, 0 ],
  '44': [ 2, 11 ],
  '45': [ 3, 5 ],
  '48': [ 4, 3 ],
  '49': [ 7, 0 ],
  '50': [ 5, 2 ],
  '52': [ 2, 13 ],
  '63': [ 3, 7 ],
  '64': [ 8, 0 ],
  '68': [ 2, 17 ],
  '72': [ 6, 2 ],
  '75': [ 5, 3 ],
  '80': [ 4, 5 ],
  '81': [ 9, 0 ],
  '98': [ 7, 2 ],
  '99': [ 3, 11 ],
  '100': [ 10, 0 ],
  '108': [ 6, 3 ],
  '112': [ 4, 7 ],
  '117': [ 3, 13 ],
  '121': [ 11, 0 ],
  '125': [ 5, 5 ],
  '128': [ 8, 2 ],
  '144': [ 12, 0 ],
  '147': [ 7, 3 ],
  '153': [ 3, 17 ],
  '162': [ 9, 2 ],
  '169': [ 13, 0 ],
  '175': [ 5, 7 ],
  '176': [ 4, 11 ],
  '180': [ 6, 5 ],
  '192': [ 8, 3 ],
  '196': [ 14, 0 ],
  '200': [ 10, 2 ],
  '208': [ 4, 13 ],
  '225': [ 15, 0 ],
  '242': [ 11, 2 ],
  '243': [ 9, 3 ],
  '245': [ 7, 5 ],
  '252': [ 6, 7 ],
  '256': [ 16, 0 ],
  '272': [ 4, 17 ],
  '275': [ 5, 11 ],
  '288': [ 12, 2 ],
  '300': [ 10, 3 ],
  '320': [ 8, 5 ],
  '325': [ 5, 13 ],
  '338': [ 13, 2 ],
  '343': [ 7, 7 ],
  '363': [ 11, 3 ],
  '392': [ 14, 2 ],
  '396': [ 6, 11 ],
  '405': [ 9, 5 ],
  '425': [ 5, 17 ],
  '432': [ 12, 3 ],
  '448': [ 8, 7 ],
  '450': [ 15, 2 ],
  '468': [ 6, 13 ],
  '500': [ 10, 5 ],
  '507': [ 13, 3 ],
  '512': [ 16, 2 ],
  '539': [ 7, 11 ],
  '567': [ 9, 7 ],
  '588': [ 14, 3 ],
  '605': [ 11, 5 ],
  '612': [ 6, 17 ],
  '637': [ 7, 13 ],
  '675': [ 15, 3 ],
  '700': [ 10, 7 ],
  '704': [ 8, 11 ],
  '720': [ 12, 5 ],
  '768': [ 16, 3 ],
  '832': [ 8, 13 ],
  '833': [ 7, 17 ],
  '845': [ 13, 5 ],
  '847': [ 11, 7 ],
  '891': [ 9, 11 ],
  '980': [ 14, 5 ],
  '1008': [ 12, 7 ],
  '1053': [ 9, 13 ],
  '1088': [ 8, 17 ],
  '1100': [ 10, 11 ],
  '1125': [ 15, 5 ],
  '1183': [ 13, 7 ],
  '1280': [ 16, 5 ],
  '1300': [ 10, 13 ],
  '1331': [ 11, 11 ],
  '1372': [ 14, 7 ],
  '1377': [ 9, 17 ],
  '1573': [ 11, 13 ],
  '1575': [ 15, 7 ],
  '1584': [ 12, 11 ],
  '1700': [ 10, 17 ],
  '1792': [ 16, 7 ],
  '1859': [ 13, 11 ],
  '1872': [ 12, 13 ],
  '2057': [ 11, 17 ],
  '2156': [ 14, 11 ],
  '2197': [ 13, 13 ],
  '2448': [ 12, 17 ],
  '2475': [ 15, 11 ],
  '2548': [ 14, 13 ],
  '2816': [ 16, 11 ],
  '2873': [ 13, 17 ],
  '2925': [ 15, 13 ],
  '3328': [ 16, 13 ],
  '3332': [ 14, 17 ],
  '3825': [ 15, 17 ],
  '4352': [ 16, 17 ]
}

function _factorRadicandNode(radicand) {
  let rv = null
  let p  = null
  let q  = null

  if (Node.Type.isConstant(radicand)) {
    const entryLUT = sqrtLUT[radicand.value]

    if (entryLUT) {
      // Use lookup table for common radicands e.g. sqrt(8) -> 2 sqrt(2)
      p = entryLUT[0]
      q = entryLUT[1]

    } else {
      // General algorithm.
      // Try to convert into form: p sqrt(q).
      const value = radicand.value
      const nMax  = Math.floor(Math.sqrt(value))

      for (let n = nMax; n > 1; n--) {
        const n2 = n * n

        if ((value % n2) === 0) {
          p = n
          q = value / n2
          break
        }
      }
    }
  }

  if (p) {
    rv = {
      p: p,
      q: q,
      pNode: Node.Creator.constant(p)
    }

    if (q && (q !== 1)) {
      // p * sqrt(q)
      rv.qNode       = Node.Creator.constant(q)
      rv.p2Node      = Node.Creator.operator('^', [rv.pNode, Node.Creator.constant(2)])
      rv.p2qNode     = Node.Creator.operator('*', [rv.p2Node, rv.qNode], false)
      rv.sqrtP2qNode = Node.Creator.kemuCreateSqrt(rv.p2qNode)
      rv.sqrtQNode   = Node.Creator.kemuCreateSqrt(rv.qNode)
    }
  }

  return rv
}

function _buildResultNode(pNode, args, argIdx, qNode) {
  let rv = null

  // p * sqrt(... a * b * q * d * e * ...)
  // Clone original args.
  const newArgs = args.slice(0)

  if (qNode) {
    // Replace one arg by qNode.
    newArgs[argIdx] = qNode
  } else {
    // qNode is null - just remove original arg.
    newArgs.splice(argIdx, 1)
  }

  if (newArgs.length > 0) {
    // Wrap args into product: ... * a * b * q * d * e * ...
    const newArgsProduct = newArgs.length > 1
    // sqrt(a*b*c*d*...) -> sqrt(c) * sqrt(a*b*d*...)
      ? Node.Creator.operator('*', newArgs, false)
    // sqrt(x*y) -> sqrt(x) * sqrt(y)
      : newArgs[0]

    // Build right node: sqrt(... * a * b * q * d * e * ...)
    const sqrtRightNode = Node.Creator.kemuCreateSqrt(newArgsProduct)

    if (pNode) {
      // Build result node: p * sqrt(... a * b * q * d * e * ...)
      rv = Node.Creator.operator('*', [pNode, sqrtRightNode], true)
    } else {
      // Build result node: sqrt(... a * b * q * d * e * ...)
      rv = sqrtRightNode
    }

  } else {
    // Perfect match - whole sqrt gone away.
    rv = pNode
  }

  return rv
}

function _collectFactors(rv, node) {
  node.args.forEach((oneArg) => {
    if (oneArg.op === '*') {
      _collectFactors(rv, oneArg)
    } else {
      rv.push(oneArg)
    }
  })
  return rv
}

function sqrtFromConstant(node) {
  let rv = Node.Status.noChange(node)

  if (Node.Type.isFunction(node, 'sqrt')) {
    let args = _collectFactors([], node)

    for (let argIdx in args) {
      const oneFactor    = args[argIdx]
      const factorResult = _factorRadicandNode(oneFactor)

      if (factorResult) {
        // Breakable factor found.
        // Clone original args.
        let pNode = factorResult.pNode
        let qNode = factorResult.qNode

        if (qNode) {
          // Non-perfect match: sqrt(x) -> p sqrt(q)
          // Step I: sqrt(p^2 * q)
          const stepNode1 = _buildResultNode(null, args, argIdx, factorResult.p2qNode)

          // Step II: p sqrt(q)
          const stepNode2 = _buildResultNode(pNode, args, argIdx, qNode)

          // Prepare substeps.
          const substeps = [
            Node.Status.nodeChanged(ChangeTypes.KEMU_FACTOR_EXPRESSION_UNDER_ROOT, node, stepNode1),
            Node.Status.nodeChanged(ChangeTypes.KEMU_SQRT_FROM_POW, stepNode1, stepNode2)
          ]

          // Final result.
          rv = Node.Status.nodeChanged(
            ChangeTypes.KEMU_SQRT_FROM_CONST, node, stepNode2, true, substeps)

        } else {
          // Perfect match: sqrt(x) -> p
          const newNode = _buildResultNode(pNode, args, argIdx, null)
          rv = Node.Status.nodeChanged(ChangeTypes.KEMU_SQRT_FROM_CONST, node, newNode)
        }

        // Move out one breakable factor at one time.
        // Don't go on anymore in current call.
        break
      }
    }
  }

  return rv
}

module.exports = sqrtFromConstant
