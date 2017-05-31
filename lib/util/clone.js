// Simple clone function, which creates a deep copy of the given node
// And recurses on the children (due to the shallow nature of the mathjs node
// clone)
function clone(node) {
  const copy = {};
  // TODO(kevinb) enable object spread by using babel
  for (const prop of Object.keys(node)) {
    if (prop === 'args') {
      copy.args = node.args.map(clone);
    } else if (prop === 'content') {
      copy.content = clone(node.content);
    } else {
      if (typeof node[prop] === 'object') {
        copy[prop] = clone(node[prop]);
      } else {
        copy[prop] = node[prop];
      }
    }
  }
  return copy;
}

module.exports = clone;
