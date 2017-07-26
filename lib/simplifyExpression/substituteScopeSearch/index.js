const math = require('mathjs');
const Node = require('../../node');
const simplifyExpressionNode = require('../stepThrough');
const TreeSearch = require('../../TreeSearch');

// Searches through the tree, prioritizing deeper nodes, and substitutes
// in-scope values for their respective expressions on a symbol node if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(scopeSubstitution);

function scopeSubstitution(node, scope) {
  if (Node.Type.isSymbol(node)) {
    // iterate over scope, substituting any match with its respective value
    // until there are no more matches.
    const symbolName = node.name;
    for (var symbol in scope) {
      const exprNode = math.parse(scope[symbol]);
      if (symbol === symbolName) {
        simplifyExpressionNode(exprNode, false, scope);
        break;
      }
    }
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = search;