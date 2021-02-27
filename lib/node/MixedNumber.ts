import { Negative } from "../Negative";
import { NodeType } from "./NodeType";
import { StepNode } from "./StepNode";

export class NodeMixedNumberImpl {
  // Returns true if `node` is a mixed number
  // e.g. 2 1/2, 19 2/3
  // Right now mathjs cannot parse the above examples;
  // instead it expects the input to look like e.g. 2(1)/(2),
  // which is division with implicit multiplication in the numerator
  // TODO: Add better support for mixed numbers in the future
  isMixedNumber(node: StepNode) {
    if (!NodeType.isOperator(node, "/")) {
      return false;
    }

    if (node.args.length !== 2) {
      return false;
    }

    const numerator = node.args[0];
    const denominator = node.args[1];

    // check for implicit multiplication between two constants in the numerator
    // first can be wrapped in unary minus
    // second one can be optionally wrapped in parenthesis
    if (!(NodeType.isOperator(numerator, "*") && numerator.implicit)) {
      return false;
    }

    const numeratorFirstArg = NodeType.isUnaryMinus(numerator.args[0])
      ? Negative.negate(numerator.args[0].args[0])
      : numerator.args[0];

    const numeratorSecondArg = NodeType.isParenthesis(numerator.args[1])
      ? numerator.args[1].content
      : numerator.args[1];

    if (
      !(
        NodeType.isConstant(numeratorFirstArg) &&
        NodeType.isConstant(numeratorSecondArg)
      )
    ) {
      return false;
    }

    // check for a constant in the denominator,
    // optionally wrapped in parenthesis
    const denominatorValue = NodeType.isParenthesis(denominator)
      ? denominator.content
      : denominator;

    if (!NodeType.isConstant(denominatorValue)) {
      return false;
    }

    return true;
  }

  // Returns true if the mixed number is negative,
  // in which case we have to ignore the negative while converting to an
  // improper fraction, and instead we negate the whole thing at the end
  // e.g. -1 2/3 !== ((-1 * 3) + 2)/3 = -1/3
  //      -1 2/3 == -((1 * 3) + 2)/3 = -5/2
  isNegativeMixedNumber = (node: StepNode) => {
    if (!this.isMixedNumber(node)) {
      throw Error("Expected a mixed number");
    }

    return NodeType.isUnaryMinus(node.args[0].args[0]);
  };

  // Get the whole number part of a mixed number
  // e.g. 1 2/3 -> 1
  // Negatives are ignored; e.g. -1 2/3 -> 1
  getWholeNumberValue = (node: StepNode) => {
    if (!this.isMixedNumber(node)) {
      throw Error("Expected a mixed number");
    }

    const wholeNumberNode = NodeType.isUnaryMinus(node.args[0].args[0])
      ? node.args[0].args[0].args[0]
      : node.args[0].args[0];

    return parseInt(wholeNumberNode.value);
  };

  // Get the numerator part of a mixed number
  // e.g. 1 2/3 -> 2
  getNumeratorValue = (node: StepNode) => {
    if (!this.isMixedNumber(node)) {
      throw Error("Expected a mixed number");
    }

    const numeratorNode = NodeType.isParenthesis(node.args[0].args[1])
      ? node.args[0].args[1].content
      : node.args[0].args[1];

    return parseInt(numeratorNode.value);
  };

  // Get the denominator part of a mixed number
  // e.g. 1 2/3 -> 3
  getDenominatorValue = (node: StepNode) => {
    if (!this.isMixedNumber(node)) {
      throw Error("Expected a mixed number");
    }

    const denominatorNode = NodeType.isParenthesis(node.args[1])
      ? node.args[1].content
      : node.args[1];

    return parseInt(denominatorNode.value);
  };
}

export const NodeMixedNumber = new NodeMixedNumberImpl();
