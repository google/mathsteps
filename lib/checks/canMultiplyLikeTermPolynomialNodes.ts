import mathNode = require("../mathnode");


// Returns true if the nodes are symbolic terms with the same symbol and no
// coefficients.
function canMultiplyLikeTermPolynomialNodes(node: mathjs.MathNode) {
  if (!mathNode.Type.isOperator(node) || node.op !== "*") {
    return false;
  }
  const args = node.args;
  if (!args.every(n => mathNode.PolynomialTerm.isPolynomialTerm(n))) {
    return false;
  }
  if (args.length === 1) {
    return false;
  }

  const polynomialTermList = node.args.map(n => new mathNode.PolynomialTerm(n));
  if (!polynomialTermList.every(polyTerm => !polyTerm.hasCoeff())) {
    return false;
  }

  const firstTerm = polynomialTermList[0];
  const restTerms = polynomialTermList.slice(1);
  // they're considered like terms if they have the same symbol name
  return restTerms.every(term => firstTerm.getSymbolName() === term.getSymbolName());
}

export = canMultiplyLikeTermPolynomialNodes;
