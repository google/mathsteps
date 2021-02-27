import { NodeType } from "./NodeType";
import { Term } from "./Term";

/**
 * For storing nth root terms, which are a subclass of Term
 * where the base node is an nth root
 * */
export class NthRootTerm extends Term {
  constructor(node, onlyImplicitMultiplication = false) {
    super(node, NthRootTerm.baseNodeFunc, onlyImplicitMultiplication);
  }

  /**
   * Returns true if the term has a base node that makes it an nth root term
   * e.g. 4x^2 has a base of x, so it is not an nth root term
   * 4*sqrt(x)^2 has a base of sqrt(x), so it is an nth root term
   * */
  static baseNodeFunc(node) {
    return NodeType.isFunction(node, "nthRoot");
  }

  /**
   * Returns true if the node represents an nth root term.
   * e.g. nthRoot(4), nthRoot(x^2), 4*nthRoot(10)^2
   * */
  static isNthRootTerm(node, onlyImplicitMultiplication = false) {
    return Term.isTerm(
      node,
      NthRootTerm.baseNodeFunc,
      onlyImplicitMultiplication
    );
  }
}
