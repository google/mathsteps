import {query} from 'math-nodes';
import * as Polynomial from '../Polynomial.js';

// Returns true if the nodes are polynomial terms that can be added together.
export function canAddLikeTermPolynomialNodes(node) {
  if (!query.isOperation(node) || node.op !== '+') {
    return false;
  }
  if (!isPolynomial(node)) {
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

