const mathNode = require('../node');
import Symbols = require('../Symbols');

// Given a node, will determine if the expression is in the form of a quadratic
// e.g. `x^2 + 2x + 1` OR `x^2 - 1` but not `x^3 + x^2 + x + 1`
function isQuadratic(node: any);
function isQuadratic(node) {
  if (!mathNode.Type.isOperator(node, '+')) {
    return false;
  }

  if (node.args.length > 3) {
    return false;
  }

  // make sure only one symbol appears in the expression
  const symbolSet = Symbols.getSymbolsInExpression(node);
  if (symbolSet.size !== 1) {
    return false;
  }

  const secondDegreeTerms = node.args.filter(isPolynomialTermOfDegree(2));
  const firstDegreeTerms = node.args.filter(isPolynomialTermOfDegree(1));
  const constantTerms = node.args.filter(mathNode.Type.isConstant);

  // Check that there is one second degree term and at most one first degree
  // term and at most one constant term
  if (secondDegreeTerms.length !== 1 || firstDegreeTerms.length > 1 ||
    constantTerms.length > 1) {
    return false;
  }

  // check that there are no terms that don't fall into these groups
  if ((secondDegreeTerms.length + firstDegreeTerms.length +
      constantTerms.length) !== node.args.length) {
    return false;
  }

  return true;
}

// Given a degree, returns a function that checks if a node
// is a polynomial term of the given degree.
function isPolynomialTermOfDegree(degree: any);
function isPolynomialTermOfDegree(degree) {
  return node => {
      if (mathNode.PolynomialTerm.isPolynomialTerm(node)) {
          const polyTerm = new mathNode.PolynomialTerm(node);
          const exponent = polyTerm.getExponentNode(true);
          return exponent && parseFloat(exponent.value) === degree;
      }
      return false;
  };
}

export = isQuadratic;
