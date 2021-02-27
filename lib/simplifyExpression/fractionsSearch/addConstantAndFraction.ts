import { addConstantFractions } from "./addConstantFractions";

import { ChangeTypes } from "../../ChangeTypes";
import { evaluate } from "../../util/evaluate";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Adds a constant to a fraction by:
// - collapsing the fraction to decimal if the constant is not an integer
//   e.g. 5.3 + 1/2 -> 5.3 + 0.2
// - turning the constant into a fraction with the same denominator if it is
//   an integer, e.g. 5 + 1/2 -> 10/2 + 1/2
export function addConstantAndFraction(node) {
  if (!NodeType.isOperator(node) || node.op !== "+" || node.args.length !== 2) {
    return NodeStatus.noChange(node);
  }

  const firstArg = node.args[0];
  const secondArg = node.args[1];
  let constNode, fractionNode;
  if (NodeType.isConstant(firstArg)) {
    if (NodeType.isIntegerFraction(secondArg)) {
      constNode = firstArg;
      fractionNode = secondArg;
    } else {
      return NodeStatus.noChange(node);
    }
  } else if (NodeType.isConstant(secondArg)) {
    if (NodeType.isIntegerFraction(firstArg)) {
      constNode = secondArg;
      fractionNode = firstArg;
    } else {
      return NodeStatus.noChange(node);
    }
  } else {
    return NodeStatus.noChange(node);
  }

  let newNode = node.cloneDeep();
  let substeps = [];
  // newConstNode and newFractionNode will end up both constants, or both
  // fractions. I'm naming them based on their original form so we can keep
  // track of which is which.
  let newConstNode, newFractionNode;
  let changeType;
  if (Number.isInteger(parseFloat(constNode.value))) {
    const denominatorNode = fractionNode.args[1];
    const denominatorValue = parseInt(denominatorNode);
    const constNodeValue = parseInt(constNode.value);
    const newNumeratorNode = NodeCreator.constant(
      constNodeValue * denominatorValue
    );
    newConstNode = NodeCreator.operator("/", [
      newNumeratorNode,
      denominatorNode,
    ]);
    newFractionNode = fractionNode;
    changeType = ChangeTypes.CONVERT_INTEGER_TO_FRACTION;
  } else {
    // round to 4 decimal places
    let dividedValue = evaluate(fractionNode);
    if (dividedValue < 1) {
      dividedValue = parseFloat(dividedValue.toPrecision(4));
    } else {
      dividedValue = parseFloat(dividedValue.toFixed(4));
    }
    newFractionNode = NodeCreator.constant(dividedValue);
    newConstNode = constNode;
    changeType = ChangeTypes.DIVIDE_FRACTION_FOR_ADDITION;
  }

  if (NodeType.isConstant(firstArg)) {
    newNode.args[0] = newConstNode;
    newNode.args[1] = newFractionNode;
  } else {
    newNode.args[0] = newFractionNode;
    newNode.args[1] = newConstNode;
  }

  substeps.push(NodeStatus.nodeChanged(changeType, node, newNode));
  newNode = NodeStatus.resetChangeGroups(newNode);

  // If we changed an integer to a fraction, we need to add the steps for
  // adding the fractions.
  if (changeType === ChangeTypes.CONVERT_INTEGER_TO_FRACTION) {
    const addFractionStatus = addConstantFractions(newNode);
    substeps = substeps.concat(addFractionStatus.substeps);
  }
  // Otherwise, add the two constants
  else {
    const evalNode = NodeCreator.constant(evaluate(newNode));
    substeps.push(
      NodeStatus.nodeChanged(ChangeTypes.SIMPLIFY_ARITHMETIC, newNode, evalNode)
    );
  }

  const lastStep = substeps[substeps.length - 1];
  newNode = NodeStatus.resetChangeGroups(lastStep.newNode);

  return NodeStatus.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC,
    node,
    newNode,
    true,
    substeps
  );
}
