const Node = require('../../node')
const TreeSearch = require('../../TreeSearch')

const reduce = require('./reduce')
const multiplyShortFormulas = require('./multiplyShortFormulas')

const SIMPLIFICATION_FUNCTIONS = [
  // x*a/x gives a
  reduce,

  // (a + b)^2 gives a^2 + 2ab + b^2 etc.
  multiplyShortFormulas,
]

const search = TreeSearch.preOrder(basics)

// Look for kemu step(s) to perform on a node. Returns a Node.Status object.
function basics(node) {
  for (let i = 0; i < SIMPLIFICATION_FUNCTIONS.length; i++) {
    const nodeStatus = SIMPLIFICATION_FUNCTIONS[i](node)
    if (nodeStatus.hasChanged()) {
      return nodeStatus
    } else {
      node = nodeStatus.newNode
    }
  }
  return Node.Status.noChange(node)
}

module.exports = search
