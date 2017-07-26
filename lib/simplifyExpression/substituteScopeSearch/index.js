const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// Searches through the tree, prioritizing deeper nodes, and substitutes
// in-scope values for their respective expressions on a symbol node if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(scopeSubstitution);

function scopeSubstitution(node, scope) {
  if (Node.Type.isSymbol(node)) {
    return substituteAndSimplifySymbols(node, scope);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// SUBSTITUTES
// Returns a Node.Status object with substeps
function substituteAndSimplifySymbols(node, scope) {
  if (!Node.Type.isSymbol(node)) {
    return Node.Status.noChange(node);
  }

  const symbolName = node.name;
  if (scope.hasOwnProperty(symbolName)) {
    const simplifyExpression = require('../../simplifyExpression');
    const substeps = simplifyExpression(scope[symbolName]);
    if (substeps.length === 0) {
      const newNode = Node.Creator.constant(Number(scope[symbolName]));
      return Node.Status.nodeChanged(
      ChangeTypes.SUBSTITUTE_SCOPE_SYMBOL, node, newNode);
    }
    else {
      const newNode = substeps.slice(-1)[0].newNode;
      return Node.Status.nodeChanged(
      ChangeTypes.SUBSTITUTE_SCOPE_SYMBOL, node, newNode, false, substeps);
    }
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = search;