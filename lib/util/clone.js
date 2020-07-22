// Simple clone function, which creates a deep copy of the given node
// And recurses on the children (due to the shallow nature of the mathjs node
// clone)
function clone(node) {
  const copy = node.clone()

  if (node.changeGroup) {
    copy.changeGroup = node.changeGroup
  }

  if (node.args) {
    node.args.forEach((child, i) => {
      copy.args[i] = clone(child)
    })
  } else if (node.content) {
    copy.content = clone(node.content)
  }

  if (node._kemuIsSorted) {
    copy._kemuIsSorted = true
    if (node.fn && node.fn.nameForPresentation) {
      copy.fn.nameForPresentation = node.fn.nameForPresentation
    }
  }

  return copy
}

module.exports = clone
