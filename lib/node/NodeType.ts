/**
 * For determining the type of a mathJS node.
 * */

import { MathNode } from "mathjs";

class NodeTypeImpl {
  isOperator(node: MathNode, operator = null) {
    return (
      node.type === NodeTypeEnum.OPERATOR_NODE &&
      node.fn !== "unaryMinus" &&
      "*+-/^".includes(node.op) &&
      (operator ? node.op === operator : true)
    );
  }

  isParenthesis(node: MathNode) {
    return node.type === NodeTypeEnum.PARENTHESIS_NODE;
  }

  /**
   * OPTIMIZE: it is a mess that this method is duplicated for static and non static use
   * */
  isUnaryMinus = (node) => {
    return node.type === NodeTypeEnum.OPERATOR_NODE && node.fn === "unaryMinus";
  };

  static isUnaryMinus = (node) => {
    return node.type === NodeTypeEnum.OPERATOR_NODE && node.fn === "unaryMinus";
  };

  isFunction(node, functionName = null) {
    if (node.type !== NodeTypeEnum.FUNCTION_NODE) {
      return false;
    }
    if (functionName && node.fn.name !== functionName) {
      return false;
    }
    return true;
  }

  isSymbol(node, allowUnaryMinus = false) {
    if (node.type === NodeTypeEnum.SYMBOL_NODE) {
      return true;
    } else if (allowUnaryMinus && NodeTypeImpl.isUnaryMinus(node)) {
      return this.isSymbol(node.args[0], false);
    } else {
      return false;
    }
  }

  isConstant = (node, allowUnaryMinus = false) => {
    if (node.type === NodeTypeEnum.CONSTANT_NODE) {
      return true;
    } else if (allowUnaryMinus && this.isUnaryMinus(node)) {
      if (this.isConstant(node.args[0], false)) {
        const value = parseFloat(node.args[0].value);
        return value >= 0;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  isConstantFraction(node, allowUnaryMinus = false) {
    if (this.isOperator(node, "/")) {
      return node.args.every((n) => this.isConstant(n, allowUnaryMinus));
    } else {
      return false;
    }
  }

  isConstantOrConstantFraction(node, allowUnaryMinus = false) {
    if (
      this.isConstant(node, allowUnaryMinus) ||
      this.isConstantFraction(node, allowUnaryMinus)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isIntegerFraction = (node, allowUnaryMinus = false) => {
    if (!this.isConstantFraction(node, allowUnaryMinus)) {
      return false;
    }
    let numerator = node.args[0];
    let denominator = node.args[1];
    if (allowUnaryMinus) {
      if (this.isUnaryMinus(numerator)) {
        numerator = numerator.args[0];
      }
      if (this.isUnaryMinus(denominator)) {
        denominator = denominator.args[0];
      }
    }
    return (
      Number.isInteger(parseFloat(numerator.value)) &&
      Number.isInteger(parseFloat(denominator.value))
    );
  };
}

export const NodeType = new NodeTypeImpl();

export enum NodeTypeEnum {
  CONSTANT_NODE = "ConstantNode",
  SYMBOL_NODE = "SymbolNode",
  FUNCTION_NODE = "FunctionNode",
  OPERATOR_NODE = "OperatorNode",
  PARENTHESIS_NODE = "ParenthesisNode",
}
