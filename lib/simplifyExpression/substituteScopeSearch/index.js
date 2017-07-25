//const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// Searches through the tree, prioritizing deeper nodes, and substitutes
// in-scope values for their respective expressions on a symbol node if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(scopeSubstitution);

function scopeSubstitution(node, scope) {
  // eslint-disable-next-line
  console.log(scope);
  if (Node.Type.isSymbol(node)) {
    return Node.Status.noChange(node);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = search;