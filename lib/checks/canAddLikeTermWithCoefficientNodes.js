const Node = require('../node');

// Returns true if the nodes are terms with coefficients that can be added together.
function canAddLikeTermWithCoefficientNodes(node, baseNodeFunc) {
  if (!Node.Type.isOperator(node) || node.op !== '+') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => Node.TermWithCoefficient.isTermWithCoefficient(
    n, baseNodeFunc))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const termList = args.map(n => new Node.TermWithCoefficient(
    n, baseNodeFunc));

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

module.exports = canAddLikeTermWithCoefficientNodes
