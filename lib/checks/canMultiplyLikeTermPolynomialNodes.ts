// Returns true if the nodes are symbolic terms with the same symbol and no
// coefficients.
import { NodeType } from "../node/NodeType";
import { PolynomialTerm } from "../node/PolynomialTerm";

export function canMultiplyLikeTermPolynomialNodes(node) {
  if (!NodeType.isOperator(node) || node.op !== "*") {
    return false;
  }
  const args = node.args;
  if (!args.every((n) => PolynomialTerm.isPolynomialTerm(n))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const polynomialTermList = node.args.map((n) => new PolynomialTerm(n));
  if (!polynomialTermList.every((polyTerm) => !polyTerm.hasCoeff())) {
    return false;
  }

  const firstTerm = polynomialTermList[0];
  const restTerms = polynomialTermList.slice(1);
  // they're considered like terms if they have the same symbol name
  return restTerms.every(
    (term) => firstTerm.getSymbolName() === term.getSymbolName()
  );
}
