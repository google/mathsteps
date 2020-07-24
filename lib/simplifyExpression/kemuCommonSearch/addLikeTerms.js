const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const constantOne = Node.Creator.constant(1)

function _hashNodeArgs(args, argStartIdx, argEndIdx) {
  // Possible improvement: Move to common code if needed.
  argStartIdx = argStartIdx || 0
  argEndIdx   = argEndIdx   || args.length

  let rv = (argEndIdx - argStartIdx).toString()

  for (let idx = argStartIdx; idx < argEndIdx; idx++) {
    rv += ',' + _hashNode(args[idx])
  }

  return rv
}

function _hashNode(node) {
  // Possible improvement: Move to common code if needed.
  let rv = ''

  if (node.op) {
    rv = 'op:' + node.op + ',' + _hashNodeArgs(node.args)

  } else if (node.name) {
    rv = node.name

  } else {
    rv = node.value
  }

  return rv
}

function _explodeNodeMulArgs(node) {
  // [2x, a, b] gives [2, x, a, b]
  let rv = []
  node.args.forEach((oneArg) => {
    if (oneArg.op === '*') {
      rv = rv.concat(_explodeNodeMulArgs(oneArg))
    } else {
      rv.push(oneArg)
    }
  })
  return rv
}

function addLikeTerm(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '+') {
    const argsHash = {}
    const newArgs  = []
    let   matched  = false

    node.args.forEach((oneArg) => {
      if (oneArg.op === '*') {
        oneArg.args = _explodeNodeMulArgs(oneArg)

        let oneArgHash  = null
        let oneArgCoeff = null
        let oneArgNode  = null

        if (Node.Type.isConstant(oneArg.args[0])) {
          // 3 x y like term.
          // Coeff: 3
          // Term: x y
          oneArgCoeff = oneArg.args[0]
          oneArgHash  = _hashNodeArgs(oneArg.args, 1)
          oneArgNode  = Node.Creator.operator('*', oneArg.args.slice(1))

        } else {
          // x y like term - general case.
          // Coeff: 1
          // Term: x y
          oneArgCoeff = constantOne
          oneArgHash  = _hashNodeArgs(oneArg.args)
          oneArgNode  = oneArg
        }

        const matchedArg = argsHash[oneArgHash]

        if (matchedArg) {
          // Args matched. Combine into one node.
          // x y + x y gives 2 x y
          matched = true
          matchedArg.arrayOfCoeffs.push(oneArgCoeff)

        } else {
          // Arg is unique at this moment. Go on.
          argsHash[oneArgHash] = {
            idx: newArgs.length,
            arrayOfCoeffs: [oneArgCoeff],
            node: oneArgNode
          }
          newArgs.push(oneArgNode)
        }

      } else {
        // Not a mul arg. Don't touch.
        newArgs.push(oneArg)
      }
    })

    if (matched) {
      // Apply collected coefficients.
      // [3, x y] => 3 x y
      for (let id in argsHash) {
        const arrayOfCoeffs = argsHash[id].arrayOfCoeffs
        const termNode      = argsHash[id].node
        const termIdx       = argsHash[id].idx

        if (arrayOfCoeffs.length > 1) {
          // c1 x y + c2 x y gives (c1 + c2) * x y
          // newCoeff: c1 + c2 + ...
          const sumOfCoeffsNode = Node.Creator.operator('+', arrayOfCoeffs)
          newArgs[termIdx] = Node.Creator.operator('*', [sumOfCoeffsNode, termNode])

        } else if (arrayOfCoeffs[0] !== constantOne) {
          // c x y
          newArgs[termIdx] = Node.Creator.operator('*', [arrayOfCoeffs[0], termNode])
        }
      }

      // Build result object.
      const newNode = Node.Creator.operator('+', newArgs)
      rv = Node.Status.nodeChanged(
        ChangeTypes.COLLECT_AND_COMBINE_LIKE_TERMS, node, newNode)
    }
  }

  return rv
}

module.exports = addLikeTerm
