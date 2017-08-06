// Simple clone function, which creates a deep copy of the given node
function clone(node) {
  return JSON.parse(JSON.stringify(node));
}

module.exports = clone;
