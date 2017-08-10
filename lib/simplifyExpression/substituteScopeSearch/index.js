const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// Searches through the tree, prioritizing deeper nodes, and substitutes
// in-scope values for their respective expressions on a symbol node if possible.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(scopeSubstitution);

function scopeSubstitution(node, options={}) {
  if (Node.Type.isSymbol(node)) {
    return substituteAndSimplifySymbols(node, options);
  }
  else {
    return Node.Status.noChange(node);
  }
}

// SUBSTITUTES
// Returns a Node.Status object with substeps
function substituteAndSimplifySymbols(node, options={}) {
  if (!options.hasOwnProperty('scope')) {
    return Node.Status.noChange(node);
  }

  if (!Node.Type.isSymbol(node)) {
    return Node.Status.noChange(node);
  }

  let symbolName;
  if (node.type === 'SymbolNode') {
    symbolName = node.name;
  }
  else if (Node.Type.isUnaryMinus(node)) {
    symbolName = node.args[0].name;
  }

  const scope = options.scope;
  if (scope.hasOwnProperty(symbolName)) {
    // when declared at top, kept getting
    // TypeError: <nameIGaveToFunction> is not a function
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
