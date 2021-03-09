import { NodeType } from "../node/NodeType";
import { getRootNode } from "../simplifyExpression/functionsSearch/nthRoot";

/**
 * Function to check if nthRoot nodes can be multiplied
 * e.g. nthRoot(x, 2) * nthRoot(x, 2) -> true
 * e.g. nthRoot(x, 2) * nthRoot(x, 3) -> false
 * */
export function canMultiplyLikeTermsNthRoots(node) {
  // checks if node is a multiplication of nthRoot nodes
  // all the terms has to have the same root node to be multiplied

  if (
    !NodeType.isOperator(node, "*") ||
    !node.args.every((term) => NodeType.isFunction(term, "nthRoot"))
  ) {
    return false;
  }

  // Take arbitrary root node
  const firstTerm = node.args[0];
  const rootNode = getRootNode(firstTerm);

  return node.args.every((term) => getRootNode(term).equals(rootNode));
}
