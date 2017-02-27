// Simple clone function, which creates a deep copy of the given node
// And recurses on the children (due to the shallow nature of the mathjs node
// clone)
function clone(node) {
  if (node === null) {
    debugger;
  }
  const copy = {};
  // TODO(kevinb) enable object spread by using babel
  for (const prop of Object.keys(node)) {
    if (prop === 'args') {
      copy.args = node.args.map(clone);
    } else if (prop === 'content') {
      copy.content = clone(node.content);
    } else {
      copy[prop] = node[prop];
    }
  }
  return copy;
}

module.exports = clone;
