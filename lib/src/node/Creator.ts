/**
 * Functions to generate any mathJS node supported by the stepper
 * see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
 * information on nodes in mathJS
 * */

import * as math from "mathjs";
import { NodeType } from "./NodeType";

class NodeCreatorClass {
  operator(op, args, implicit = false) {
    switch (op) {
      case "+":
        return new (math as any).OperatorNode("+", "add", args);
      case "-":
        return new (math as any).OperatorNode("-", "subtract", args);
      case "/":
        return new (math as any).OperatorNode("/", "divide", args);
      case "*":
        return new (math as any).OperatorNode("*", "multiply", args, implicit);
      case "^":
        return new (math as any).OperatorNode("^", "pow", args);
      default:
        throw Error("Unsupported operation: " + op);
    }
  }

  // In almost all cases, use Negative.negate (with naive = true) to add a
  // unary minus to your node, rather than calling this constructor directly
  unaryMinus(content) {
    return new (math as any).OperatorNode("-", "unaryMinus", [content]);
  }

  constant(val) {
    return new (math as any).ConstantNode(val);
  }

  symbol(name) {
    return new (math as any).SymbolNode(name);
  }

  parenthesis(content) {
    return new (math as any).ParenthesisNode(content);
  }

  list(content) {
    return new (math as any).ArrayNode(content);
  }

  // exponent might be null, which means there's no exponent node.
  // similarly, coefficient might be null, which means there's no coefficient
  // the base node can never be null.
  term(base, exponent, coeff, explicitCoeff = false) {
    let term = base;
    if (exponent) {
      term = this.operator("^", [term, exponent]);
    }
    if (coeff && (explicitCoeff || parseFloat(coeff.value) !== 1)) {
      if (
        NodeType.isConstant(coeff) &&
        parseFloat(coeff.value) === -1 &&
        !explicitCoeff
      ) {
        // if you actually want -1 as the coefficient, set explicitCoeff to true
        term = this.unaryMinus(term);
      } else {
        term = this.operator("*", [coeff, term], true);
      }
    }
    return term;
  }

  polynomialTerm(symbol, exponent, coeff, explicitCoeff = false) {
    return this.term(symbol, exponent, coeff, explicitCoeff);
  }

  // Given a root value and a radicand (what is under the radical)
  nthRoot(radicandNode, rootNode) {
    const symbol = NodeCreator.symbol("nthRoot");
    return new (math as any).FunctionNode(symbol, [radicandNode, rootNode]);
  }
}

export const NodeCreator = new NodeCreatorClass();
