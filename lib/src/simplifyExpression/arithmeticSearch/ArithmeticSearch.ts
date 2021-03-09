import { ChangeTypes } from "../../ChangeTypes";
import { evaluate } from "../../util/evaluate";
import { NodeType } from "../../node/NodeType";
import { TreeSearch } from "../../TreeSearch";
import { NodeCreator } from "../../node/Creator";
import { NodeStatus } from "../../node/NodeStatus";

/**
 * Searches through the tree, prioritizing deeper nodes, and evaluates
 * arithmetic (e.g. 2+2 or 3*5*2) on an operation node if possible.
 * Returns a Status object.
 * */
export const arithmeticSearch = TreeSearch.postOrder(arithmetic);

/**
 * evaluates arithmetic (e.g. 2+2 or 3*5*2) on an operation node.
 * Returns a Status object.
 * */
function arithmetic(node) {
  if (!NodeType.isOperator(node)) {
    return NodeStatus.noChange(node);
  }
  if (!node.args.every((child) => NodeType.isConstant(child, true))) {
    return NodeStatus.noChange(node);
  }

  // we want to eval each arg so unary minuses around constant nodes become
  // constant nodes with negative values
  node.args.forEach((arg, i) => {
    node.args[i] = NodeCreator.constant(evaluate(arg));
  });

  // Only resolve division of integers if we get an integer result.
  // Note that a fraction of decimals will be divided out.
  if (NodeType.isIntegerFraction(node)) {
    const numeratorValue = parseInt(node.args[0]);
    const denominatorValue = parseInt(node.args[1]);
    if (numeratorValue % denominatorValue === 0) {
      const newNode = NodeCreator.constant(numeratorValue / denominatorValue);
      return NodeStatus.nodeChanged(
        ChangeTypes.SIMPLIFY_ARITHMETIC,
        node,
        newNode
      );
    } else {
      return NodeStatus.noChange(node);
    }
  } else {
    const evaluatedValue = evaluateAndRound(node);
    const newNode = NodeCreator.constant(evaluatedValue);
    return NodeStatus.nodeChanged(
      ChangeTypes.SIMPLIFY_ARITHMETIC,
      node,
      newNode
    );
  }
}

/**
 * Evaluates a math expression to a constant, e.g. 3+4 -> 7 and rounds if
 * necessary
 * */
function evaluateAndRound(node) {
  let result = evaluate(node);
  if (Math.abs(result) < 1) {
    result = parseFloat(result.toPrecision(4));
  } else {
    result = parseFloat(result.toFixed(4));
  }
  return result;
}
