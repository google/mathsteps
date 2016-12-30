'use strict';

const Node = require('../node');

// Returns true if the nodes are polynomial terms that can be added together.
function canAddLikeTermPolynomialNodes(node) {
  if (!Node.Type.isOperator(node) || node.op !== '+') {
    return false;
  }
  const args = node.args;
  if (!args.every(n => Node.PolynomialTerm.isPolynomialTerm(n))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const polynomialTermList = args.map(n => new Node.PolynomialTerm(n));

  // to add terms, they must have the same symbol name *and* exponent
  const firstTerm = polynomialTermList[0];
  const sharedSymbol = firstTerm.getSymbolName();
  const sharedExponentNode = firstTerm.getExponentNode(true);

  const restTerms = polynomialTermList.slice(1);
  return restTerms.every(term => {
    const haveSameSymbol = sharedSymbol === term.getSymbolName();
    const exponentNode = term.getExponentNode(true);
    const haveSameExponent = exponentNode.equals(sharedExponentNode);
    return haveSameSymbol && haveSameExponent;
  });
}

module.exports = canAddLikeTermPolynomialNodes;
