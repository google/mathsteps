const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const math = require('mathjs')

// Limit exponent to (a+b)^10.
const MAX_EXPONENT = 10

// Precompute common integer nodes.
const CACHE_ConstantIntegers = [
  [Node.Creator.constant(0) , Node.Creator.constant(0)], // -0, +0
  [Node.Creator.constant(-1), Node.Creator.constant(1)], // -1, +1
  [Node.Creator.constant(-2), Node.Creator.constant(2)], // -2, +2
  [Node.Creator.constant(-3), Node.Creator.constant(3)], // -3, +3
  [Node.Creator.constant(-4), Node.Creator.constant(4)], // -4, +4
]

// Cache binomial coefficient (Pascal's triangle).
// One row is array of binomial with given n:
//          n!
// (n) = ---------
// (k)   k! (n-k)!
const CACHE_PascalTriangleForSum        = []
const CACHE_PascalTriangleForDifference = []

function _getPascalTriangleRowForSum(n) {
  let rv = CACHE_PascalTriangleForSum[n]

  if (!rv) {
    // First row usage. Build it and cache for further use.
    // Example for n=4: [1 4 6 4 1].
    rv = []
    const n2 = Math.ceil(n / 2)

    // Build the first half of row from the scratch.
    // https://stackoverflow.com/questions/11032781/fastest-way-to-generate-binomial-coefficients
    rv[0] = _createNodeInteger(1)
    for (let k = 0; k < n2; k++) {
      rv[k + 1] = _createNodeInteger((rv[k].value * (n - k)) / (k + 1))
    }

    // The second half if copy of the first one.
    for (let k = 0; k < n2; k++) {
      rv[n - k] = rv[k]
    }

    // Cache row for further calls.
    CACHE_PascalTriangleForSum[n] = rv
  }

  return rv
}

function _getPascalTriangleRowForDifference(n) {
  let rv = CACHE_PascalTriangleForDifference[n]

  if (!rv) {
    // First row usage. Build it and cache for further use.
    // Example for n=2: [1, -2, 1].
    // Example for n=3: [1, -3, 3, 1].
    // Example for n=4: [1, -4, 6, -4, 1].
    rv = _getPascalTriangleRowForSum(n).slice(0)

    for (let idx = 1; idx < n; idx += 2) {
      // Negate odd coefficients.
      rv[idx] = Node.Creator.unaryMinus(rv[idx])
    }

    // Cache row for further calls.
    CACHE_PascalTriangleForDifference[n] = rv
  }

  return rv
}

function _getArrayOfCoefficients(n, sign) {
  if (sign === -1) {
    return _getPascalTriangleRowForDifference(n)
  } else {
    return _getPascalTriangleRowForSum(n)
  }
}

function _createNodeInteger(value, sign) {
  let rv         = null
  let cacheEntry = CACHE_ConstantIntegers[value]

  if (!cacheEntry) {
    // First integer usage.
    // Create new underlying node and cache for further usage.
    cacheEntry = [Node.Creator.constant(-value), Node.Creator.constant(value)]
    CACHE_ConstantIntegers[value] = cacheEntry
  }

  if (sign === -1) {
    // -value
    rv = cacheEntry[0]
  } else {
    // +value
    rv = cacheEntry[1]
  }

  return rv
}

function _createNodePow(a, k) {
  // a^k
  let rv = null

  switch(k) {
    case 0: {
      // a^0 = 1
      rv = _createNodeInteger(1)
      break
    }

    case 1: {
      // a^1 = a
      rv = a
      break
    }

    default: {
      // General case: a^n
      rv = Node.Creator.operator('^', [a, _createNodeInteger(k)])
    }
  }
  return rv
}

function multiplyShortFormulas(node) {
  let rv = Node.Status.noChange(node)

  if ((node.op == '^') &&
      Node.Type.isConstant(node.args[1]) &&
      Node.Type.isParenthesis(node.args[0]) &&
      (node.args[0].content.op === '+') &&
      (node.args[0].content.args.length === 2)) {

    // (a+b)^n or (a-b)^n
    const n = parseInt(node.args[1].value)

    if ((n > 1) &&
        (n <= MAX_EXPONENT) &&
        (node.args[1].value.toString() === n.toString())) {

      // n is integer greatater than one. Go on.
      const terms    = []
      let changeType = null
      let newNode    = null

      const a = node.args[0].content.args[0]
      let   b = node.args[0].content.args[1]

      // Handle negative second argument.
      // Split second argument (b) into value and sign part.
      let bSign = 1

      if (Node.Type.isUnaryMinus(b)) {
        // (a-b)^n
        b     = b.args[0]
        bSign = -1

      } else if (Node.Type.kemuIsConstantNegative(b)) {
        // (a-4)^n like.
        b     = Node.Creator.constant(math.multiply(-1, b.value))
        bSign = -1
      }

      if (bSign === -1) {
        // (a-b)^n
        changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_ABN_SUB

        switch (n) {
          case 2:  changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_AB2_SUB; break
          case 3:  changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_AB3_SUB; break
          default: changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_ABN_SUB
        }

      } else {
        // (a+b)^n
        changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_ABN_ADD

        switch (n) {
          case 2:  changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_AB2_ADD; break
          case 3:  changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_AB3_ADD; break
          default: changeType = ChangeTypes.KEMU_SHORT_MULTIPLICATION_ABN_ADD
        }
      }

      // The first a^n term.
      terms.push(_createNodePow(a, n))

      // Mixed terms containing both a and b.
      const arrayOfCoeffs = _getArrayOfCoefficients(n, bSign)

      for (let k = 1; k < n; k++) {
        // binomial(n, k) * a^(n-k) * b^k
        const termA = _createNodePow(a, n - k)
        const termB = _createNodePow(b, k)
        terms.push(Node.Creator.operator('*', [arrayOfCoeffs[k], termA, termB]))
      }

      // The last b^n term.
      let bn = _createNodePow(b, n)

      if ((bSign === -1) && (n % 2 === 1)) {
        bn = Node.Creator.unaryMinus(bn)
      }
      terms.push(bn)

      // Join all terms into final sum:
      // a^n + c1*a^(n-1)*k + ... + b^n
      newNode = Node.Creator.operator('+', terms)

      // Build result object if possible.
      rv = Node.Status.nodeChanged(changeType, node, newNode)
    }
  }

  return rv
}

module.exports = multiplyShortFormulas
