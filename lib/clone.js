'use strict';

// Simple clone function, which creates a copy of the given node
// And recurses on the children (due to the shallow nature of the copy)
function clone(node) {
  let copy = node.clone();
  if (node.args) {
    node.args.forEach((child, i) => {
      copy.args[i] = clone(child);
    });
  }
  else if (node.content) {
    copy.content = clone(node.content)
  }
  return copy;
}

module.exports = clone;
