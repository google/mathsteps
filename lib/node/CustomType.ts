import { Negative } from "../Negative";
import { NodeCreator } from "./Creator";
import { NodeType } from "./NodeType";
import {MathNode} from 'mathjs';

class NodeCustomTypeImpl {

  // Returns true if `node` belongs to the type specified by boolean `isTypeFunc`.
  // If `allowUnaryMinus/allowParens` is true, we allow for the node to be nested.
  isType(node: MathNode, isTypeFunc, allowUnaryMinus = true, allowParens = true) {
    if (isTypeFunc(node)) {
      return true;
    } else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
      return this.isType(
        node.args[0],
        isTypeFunc,
        allowUnaryMinus,
        allowParens
      );
    } else if (allowParens && NodeType.isParenthesis(node)) {
      return this.isType(
        node.content,
        isTypeFunc,
        allowUnaryMinus,
        allowParens
      );
    }

    return false;
  }

  // Returns `node` if `node` belongs to the type specified by boolean `isTypeFunc`.
  // If `allowUnaryMinus/allowParens` is true, we check for an inner node of this type.
  // `moveUnaryMinus` should be defined if `allowUnaryMinus` is true, and should
  // move the unaryMinus into the inside of the type
  // e.g. for fractions, this function will negate the numerator
  getType(
    node: MathNode,
    isTypeFunc,
    allowUnaryMinus = true,
    allowParens = true,
    moveUnaryMinus = undefined
  ): MathNode {

    if (allowUnaryMinus === true && moveUnaryMinus === undefined) {
      throw Error("Error in `getType`: moveUnaryMinus is undefined");
    }

    if (isTypeFunc(node)) {
      return node;
    } else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
      return moveUnaryMinus(
        this.getType(
          node.args[0],
          isTypeFunc,
          allowUnaryMinus,
          allowParens,
          moveUnaryMinus
        )
      );
    } else if (allowParens && NodeType.isParenthesis(node)) {
      return this.getType(
        node.content,
        isTypeFunc,
        allowUnaryMinus,
        allowParens,
        moveUnaryMinus
      );
    }

    throw Error(
      "`getType` called on a node that does not belong to specified type"
    );
  }

  isFraction(node: MathNode, allowUnaryMinus = true, allowParens = true) {
    return this.isType(
      node,
      (node) => NodeType.isOperator(node, "/"),
      allowUnaryMinus,
      allowParens
    );
  }

  getFraction(node: MathNode, allowUnaryMinus = true, allowParens = true) {
    const moveUnaryMinus = function (node) {
      if (!NodeType.isOperator(node, "/")) {
        throw Error("Expected a fraction");
      }

      const numerator = node.args[0];
      const denominator = node.args[1];
      const newNumerator = Negative.negate(numerator);
      return NodeCreator.operator("/", [newNumerator, denominator]);
    };

    return this.getType(
      node,
      (node) => NodeType.isOperator(node, "/"),
      allowParens,
      allowUnaryMinus,
      moveUnaryMinus
    );
  }
}

export const NodeCustomType = new NodeCustomTypeImpl();
