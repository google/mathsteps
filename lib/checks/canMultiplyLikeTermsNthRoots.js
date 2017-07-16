const Node = require('../node');
const NthRoot = require('../simplifyExpression/functionsSearch/nthRoot');

// Function to check if nthRoot nodes can be multiplied
// e.g. nthRoot(x, 2) * nthRoot(x, 2) -> true
// e.g. nthRoot(x, 2) * nthRoot(x, 3) -> false
function canMultiplyLikeTermsNthRoots(node) {
  // checks if node is a multiplication of nthRoot nodes
  // all the terms has to have the same root node to be multiplied

  if (!Node.Type.isOperator(node, '*')
      || !(node.args.every(term => Node.Type.isFunction(term, 'nthRoot')))){
    return false;
  }

  // Take arbitrary root node
  const firstTerm = node.args[0];
  const rootNode = NthRoot.getRootNode(firstTerm);

  return node.args.every(
    term => NthRoot.getRootNode(term).equals(rootNode));
}

module.exports = canMultiplyLikeTermsNthRoots;
