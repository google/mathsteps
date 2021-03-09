import { resolvesToConstant } from "./resolvesToConstant";
import { NodeType } from "../node/NodeType";

/**
 * Return true if the equation is of the form factor * factor = 0 or factor^power = 0
 * e.g (x - 2)^2 = 0, x(x + 2)(x - 2) = 0
 */
export function canFindRoots(equation) {
  const left = equation.leftNode;
  const right = equation.rightNode;

  const zeroRightSide =
    NodeType.isConstant(right) && parseFloat(right.value) === 0;

  const isMulOrPower =
    NodeType.isOperator(left, "*") || NodeType.isOperator(left, "^");

  if (!(zeroRightSide && isMulOrPower)) {
    return false;
  }

  // If the left side of the equation is multiplication, filter out all the factors
  // that do evaluate to constants because they do not have roots. If the
  // resulting array is empty, there is no roots to be found. Do a similiar check
  // for when the left side is a power node.
  // e.g 2^7 and (33 + 89) do not have solutions when set equal to 0

  if (NodeType.isOperator(left, "*")) {
    const factors = left.args.filter((arg) => !resolvesToConstant(arg));
    return factors.length >= 1;
  } else if (NodeType.isOperator(left, "^")) {
    return !resolvesToConstant(left);
  }
}
