const ChangeTypes = require('../../ChangeTypes')
const Node = require('../../node')
const clone = require('../../util/clone')

function _areNodesSqrtsWithTheSameRoot(node1, node2) {
  let rv = Node.Type.isFunction(node1, 'sqrt') &&
           Node.Type.isFunction(node2, 'sqrt') &&
           node1.args[0].equals(node2.args[0])

  return rv
}

function _multiplySqrtNodes(node1, node2) {
  const newRoot = Node.Creator.operator('*', [node1.args[0], node2.args[0]])
  let rv = clone(node1)
  rv.args[0] = newRoot
  return rv
}

function sqrtMultiplication(node) {
  let rv = Node.Status.noChange(node)

  if (node.op == '*') {
    if ((node.args.length == 2) && _areNodesSqrtsWithTheSameRoot(node.args[0], node.args[1])) {
      // sqrt(a)*sqrt(a) gives a
      const newNode = clone(node.args[1].args[0])

      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT, node, newNode)
    } else if ((node.args.length == 2) &&
             (Node.Type.isFunction(node.args[0], 'sqrt')) &&
             (Node.Type.isFunction(node.args[1], 'sqrt'))) {
      // sqrt(a)*sqrt(b) gives sqrt(a*b)
      const newNode = _multiplySqrtNodes(node.args[0], node.args[1])
      rv = Node.Status.nodeChanged(
        ChangeTypes.KEMU_MULTIPLY_SQRTS, node, newNode)
    } else if (node.args.length > 1) {
      // (...* sqrt(c) * sqrt(c) * ...) gives (... * c * ...)
      let args       = node.args
      let newArgs    = []
      let changed    = false
      let changeType = null

      for (let idx = 0; idx < args.length; idx++) {
        if (!changed && (idx < args.length - 1)) {
          if (_areNodesSqrtsWithTheSameRoot(args[idx], args[idx + 1])) {
            changed    = true
            changeType = ChangeTypes.KEMU_MULTIPLY_SQRTS_WITH_COMMON_ROOT
            newArgs.push(args[idx].args[0])
            idx++
          } else if ((idx < args.length - 1) &&
                   (Node.Type.isFunction(args[idx], 'sqrt')) &&
                   (Node.Type.isFunction(args[idx + 1], 'sqrt'))) {
            changed    = true
            changeType = ChangeTypes.KEMU_MULTIPLY_SQRTS

            const newNode = _multiplySqrtNodes(args[idx], args[idx + 1])
            newArgs.push(newNode)
            idx++
          } else {
            newArgs.push(args[idx])
          }
        } else {
          newArgs.push(args[idx])
        }
      }

      if (changed) {
        const newNode = clone(node)

        newNode.args = newArgs

        rv = Node.Status.nodeChanged(changeType, node, newNode)
      }
    }
  }
  return rv
}

module.exports = sqrtMultiplication
