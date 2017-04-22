import * as nodeHelper from "./nodeHelper";
import Equation from "./Equation";
class Symbols{
    
// returns the set of all the symbols in an equation
static getSymbolsInEquation(equation: Equation) {
  const leftSymbols = Symbols.getSymbolsInExpression(equation.leftNode);
  const rightSymbols = Symbols.getSymbolsInExpression(equation.rightNode);
  const symbols = new Set([...leftSymbols, ...rightSymbols]);
  return symbols;
};

// return the set of symbols in the expression tree
static getSymbolsInExpression(expression) {
  const symbolNodes = expression.filter(node => node.isSymbolNode); // all the symbol nodes
  const symbols = symbolNodes.map(node => node.name); // all the symbol nodes' names
  const symbolSet = new Set(symbols); // to get rid of duplicates
  return symbolSet;
};

// Iterates through a node and returns the polynomial term with the symbol name
// Returns null if no terms with the symbol name are in the node.
// e.g. 4x^2 + 2x + y + 2 with `symbolName=x` would return 2x
static getLastSymbolTerm(node: mNode, symbolName: string) {
  // First check if the node itself is a polyomial term with symbolName
  if (Symbols.isSymbolTerm(node, symbolName)) {
    return node;
  }
  // Otherwise, it's a sum of terms. Look through the operands for a term
  // with `symbolName`
  else if (nodeHelper.Type.isOperator(node, '+')) {
    for (let i = node.args.length - 1; i >= 0 ; i--) {
      const child = node.args[i];
      if (Symbols.isSymbolTerm(child, symbolName)) {
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
static getLastNonSymbolTerm(node: mNode, symbolName: string) {
  if (Symbols.isSymbolTerm(node, symbolName)) {
    return new nodeHelper.PolynomialTerm(node).getCoeffNode();
  }
  else if (nodeHelper.Type.isOperator(node)) {
    for (let i = node.args.length - 1; i >= 0 ; i--) {
      const child = node.args[i];
      if (!Symbols.isSymbolTerm(child, symbolName)) {
        return child;
      }
    }
  }

  return null;
};

// Returns if `node` is a polynomial term with symbol `symbolName`
static isSymbolTerm(node: mNode, symbolName: string) {
  if (nodeHelper.PolynomialTerm.isPolynomialTerm(node)) {
    const polyTerm = new nodeHelper.PolynomialTerm(node);
    if (polyTerm.getSymbolName() === symbolName) {
      return true;
    }
  }
  return false;
}
}
//Probably shouldn't do this but whatever
interface Set<T> {
    add(value: T): Set<T>;
    clear(): void;
    delete(value: T): boolean;
    entries(): IterableIterator<[T, T]>;
    forEach(callbackfn: (value: T, index: T, set: Set<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    keys(): IterableIterator<T>;
    size: number;
    values(): IterableIterator<T>;
    [Symbol.iterator]():IterableIterator<T>;
    [Symbol.toStringTag]: string;
}

interface SetConstructor {
    new <T>(): Set<T>;
    new <T>(iterable: Iterable<T>): Set<T>;
    prototype: Set<any>;
}
declare var Set: SetConstructor;