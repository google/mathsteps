const Node = require('../node')

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

function _kemuSortArgs(node) {

  if (!node._kemuIsSorted) {
    // Avoid sorting the same node twice.
    node._kemuIsSorted = true

    if (Node.Type.isParenthesis(node)) {
      // Go into parenthesis recursively.
      _kemuSortArgs(node.content)

    } else if (node.args) {
      // Sort args recursively.
      node.args.forEach((oneChild) => {
        _kemuSortArgs(oneChild)
      })

      if (node.op === '*') {
        const numbers = []
        const symbols = []
        const other   = []

        // Flatten nested multiply e.g. (3*x)*y =>3*x*y
        node.args = _explodeNodeMulArgs(node)

        // Divide child into 3 groups:
        // - number constants e.g. 3.14,
        // - symbols e.g. x,
        // - other nodes e.g. x + a/4
        node.args.forEach((oneChild) => {
          if (Node.Type.isConstantOrConstantFraction(oneChild)) {
            // Constant number node e.g. 3.14
            numbers.push(oneChild)

          } else if (Node.Type.isUnaryMinus(oneChild) &&
                     Node.Type.isConstantOrConstantFraction(oneChild.args[0])) {
            // Constant negated number node e.g. -3.14
            // Possible improvement: Handle negated symbols (-x).
            numbers.push(oneChild)

          } else if (Node.Type.isSymbol(oneChild)) {
            // Symbol node e.g. x
            symbols.push(oneChild)

          } else {
            // Other node e.g. (x + a/4)
            other.push(oneChild)
          }
        })

        // Sort symbols by name.
        symbols.sort((a, b) => {
          if (a.name < b.name) {
            return -1

          } else if (a.name > b.name) {
            return 1

          } else {
            return 0
          }
        })

        // Join node groups in the following order:
        // | unsorted constants | symbols sorted by name | unsorted other |
        let newArgs = []
        newArgs = newArgs.concat(numbers)
        newArgs = newArgs.concat(symbols)
        newArgs = newArgs.concat(other)

        // Apply new args order.
        node.args = newArgs
      }
    }
  }
}

module.exports = _kemuSortArgs
