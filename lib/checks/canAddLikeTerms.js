const Node = require('../node');

// Returns true if the nodes are terms that can be added together.
// The nodes need to have the same base and exponent
// e.g. 2x + 5x, 6x^2 + x^2, nthRoot(4,2) + nthRoot(4,2)
function canAddLikeTermNodes(node, termSubclass) {
  if (!Node.Type.isOperator(node, '+')) {
    return false;
  }
  const args = node.args;
  if (!args.every(n => Node.Term.isTerm(n, termSubclass.baseNodeFunc))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const termList = args.map(n => new termSubclass(n));

  // to add terms, they must have the same base *and* exponent
  const firstTerm = termList[0];
  const sharedBase = firstTerm.getBaseNode();
  const sharedExponentNode = firstTerm.getExponentNode(true);

  const restTerms = termList.slice(1);
  return restTerms.every(term => {
    const haveSameBase = sharedBase.equals(term.getBaseNode());
    const exponentNode = term.getExponentNode(true);
    const haveSameExponent = exponentNode.equals(sharedExponentNode);
    return haveSameBase && haveSameExponent;
  });
}

// Returns true if the nodes are nth roots that can be added together
function canAddLikeTermNthRootNodes(node) {
  return canAddLikeTermNodes(node, Node.NthRootTerm);
}

// Returns true if the nodes are polynomial terms that can be added together.
function canAddLikeTermPolynomialNodes(node) {
  return canAddLikeTermNodes(node, Node.PolynomialTerm);
}

module.exports = {
  canAddLikeTermNodes,
  canAddLikeTermNthRootNodes,
  canAddLikeTermPolynomialNodes,
};
