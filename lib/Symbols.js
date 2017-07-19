const Node = require('./node');

const Symbols = {};

// returns the set of all the symbols in an equation
Symbols.getSymbolsInEquation = function(equation) {
  const leftSymbols = Symbols.getSymbolsInExpression(equation.leftNode);
  const rightSymbols = Symbols.getSymbolsInExpression(equation.rightNode);
  const symbols = new Set([...leftSymbols, ...rightSymbols]);
  return symbols;
};

// return the set of symbols in the expression tree
Symbols.getSymbolsInExpression = function(expression) {
  const symbolNodes = expression.filter(node => node.isSymbolNode); // all the symbol nodes
  const symbols = symbolNodes.map(node => node.name); // all the symbol nodes' names
  const symbolSet = new Set(symbols); // to get rid of duplicates
  return symbolSet;
};

// Iterates through a node and returns the last term with the symbol name
// Returns null if no terms with the symbol name are in the node.
// e.g. 4x^2 + 2x + y + 2 with `symbolName=x` would return 2x
Symbols.getLastSymbolTerm = function(node, symbolName) {
  // First check if the node itself is a polyomial term with symbolName
  if (isSymbolTerm(node, symbolName)) {
    return node;
  }
  // If it's a sum of terms, look through the operands for a term
  // with `symbolName`
  else if (Node.Type.isOperator(node, '+')) {
    for (let i = node.args.length - 1; i >= 0 ; i--) {
      const child = node.args[i];
      if (Node.Type.isOperator(child, '+')) {
        return Symbols.getLastSymbolTerm(child, symbolName);
      }
      else if (isSymbolTerm(child, symbolName)) {
        return child;
      }
    }
  }
  return null;
};

// Iterates through a node and returns the last term that does not have the
// symbolName including other polynomial terms, and constants or constant
// fractions
// e.g. 4x^2 with `symbolName=x` would return 4
// e.g. 4x^2 + 2x + 2/4 with `symbolName=x` would return 2/4
// e.g. 4x^2 + 2x + y with `symbolName=x` would return y
Symbols.getLastNonSymbolTerm = function(node, symbolName) {
  if (isPolynomialTermWithSymbol(node, symbolName)) {
    return new Node.PolynomialTerm(node).getCoeffNode();
  }
  else if (hasDenominatorSymbol(node, symbolName)) {
    return null;
  }
  else if (Node.Type.isOperator(node)) {
    for (let i = node.args.length - 1; i >= 0 ; i--) {
      const child = node.args[i];
      if (Node.Type.isOperator(child, '+')) {
        return Symbols.getLastNonSymbolTerm(child, symbolName);
      }
      else if (!isSymbolTerm(child, symbolName)) {
        return child;
      }
    }
  }

  return null;
};

// Iterates through a node and returns the denominator if it has a
// symbolName in its denominator
// e.g. 1/(2x) with `symbolName=x` would return 2x
// e.g. 1/(x+2) with `symbolName=x` would return x+2
// e.g. 1/(x+2) + (x+1)/(2x+3) with `symbolName=x` would return (2x+3)
Symbols.getLastDenominatorWithSymbolTerm = function(node, symbolName) {
  // First check if the node itself has a symbol in the denominator
  if (hasDenominatorSymbol(node, symbolName)) {
    return node.args[1];
  }
  // Otherwise, it's a sum of terms. e.g. 1/x + 1(2+x)
  // Look through the operands for a
  // denominator term with `symbolName`
  else if (Node.Type.isOperator(node, '+')) {
    for (let i = node.args.length - 1; i >= 0 ; i--) {
      const child = node.args[i];
      if (Node.Type.isOperator(child, '+')) {
        return Symbols.getLastDenominatorWithSymbolTerm(child, symbolName);
      }
      else if (hasDenominatorSymbol(child, symbolName)) {
        return child.args[1];
      }
    }
  }
  return null;
};

// Returns if `node` is a term with symbol `symbolName`
function isSymbolTerm(node, symbolName) {
  return isPolynomialTermWithSymbol(node, symbolName) ||
    hasDenominatorSymbol(node, symbolName);
}

function isPolynomialTermWithSymbol(node, symbolName) {
  if (Node.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new Node.PolynomialTerm(node);
    if (polyTerm.getSymbolName() === symbolName) {
      return true;
    }
  }

  return false;
}

// Return if `node` has a symbol in its denominator
// e.g. true for 1/(2x)
// e.g. false for 5x
function hasDenominatorSymbol(node, symbolName) {
  if (Node.Type.isOperator(node) && node.op === '/') {
    const allSymbols = Symbols.getSymbolsInExpression(node.args[1]);
    return allSymbols.has(symbolName);
  }

  return false;
}

module.exports = Symbols;
