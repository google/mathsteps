const Node = require('../node');
const print = require('../util/print');

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
    // TODO(math-parser): make an equals function
    const haveSameBase = print.ascii(sharedBase) === print.ascii(term.getBaseNode());
    const exponentNode = term.getExponentNode(true);
    const haveSameExponent = print.ascii(exponentNode) === print.ascii(sharedExponentNode);
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
