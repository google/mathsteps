const Node = require('../../node')
const TreeSearch = require('../../TreeSearch')

const calculateNumericalValue = require('./calculateNumericalValue')

const SIMPLIFICATION_FUNCTIONS = [
  // sqrt(2) gives 1.41421356237309505 etc.
  calculateNumericalValue,
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
