import addConstantFractions = require("./addConstantFractions");
import clone = require("../../util/clone");
import ChangeTypes = require("../../ChangeTypes");
import evaluate = require("../../util/evaluate");
import mathNode = require("../../mathnode");

// Adds a constant to a fraction by:
// - collapsing the fraction to decimal if the constant is not an integer
//   e.g. 5.3 + 1/2 -> 5.3 + 0.2
// - turning the constant into a fraction with the same denominator if it is
//   an integer, e.g. 5 + 1/2 -> 10/2 + 1/2
function addConstantAndFraction(node: mathjs.MathNode) {
  if (!mathNode.Type.isOperator(node) || node.op !== "+" || node.args.length !== 2) {
    return mathNode.Status.noChange(node);
  }
    const [firstArg, secondArg] = node.args;
    let constNode, fractionNode;
  if (mathNode.Type.isConstant(firstArg)) {
    if (mathNode.Type.isIntegerFraction(secondArg)) {
      constNode = firstArg;
      fractionNode = secondArg;
    }
    else {
      return mathNode.Status.noChange(node);
    }
  }
  else if (mathNode.Type.isConstant(secondArg)) {
    if (mathNode.Type.isIntegerFraction(firstArg)) {
      constNode = secondArg;
      fractionNode = firstArg;
    }
    else {
      return mathNode.Status.noChange(node);
    }
  }
  else {
    return mathNode.Status.noChange(node);
  }

  let newNode = clone(node);
  let substeps = [];
  // newConstNode and newFractionNode will end up both constants, or both
  // fractions. I'm naming them based on their original form so we can keep
  // track of which is which.
  let newConstNode, newFractionNode;
  let changeType;
  if (parseFloat(constNode.value) % 1 === 0) {
    const denominatorNode = fractionNode.args[1];
    const denominatorValue = parseInt(denominatorNode);
    const constNodeValue = parseInt(constNode.value);
    const newNumeratorNode = mathNode.Creator.constant(
      constNodeValue * denominatorValue);
    newConstNode = mathNode.Creator.operator(
      "/", [newNumeratorNode, denominatorNode]);
    newFractionNode = fractionNode;
    changeType = ChangeTypes.CONVERT_INTEGER_TO_FRACTION;
  }
  else {
    // round to 4 decimal places
    let dividedValue = evaluate(fractionNode);
    if (dividedValue < 1) {
      dividedValue = parseFloat(dividedValue.toPrecision(4));
    }
    else {
      dividedValue = parseFloat(dividedValue.toFixed(4));
    }
    newFractionNode = mathNode.Creator.constant(dividedValue);
    newConstNode = constNode;
    changeType = ChangeTypes.DIVIDE_FRACTION_FOR_ADDITION;
  }

  if (mathNode.Type.isConstant(firstArg)) {
    newNode.args[0] = newConstNode;
    newNode.args[1] = newFractionNode;
  }
  else {
    newNode.args[0] = newFractionNode;
    newNode.args[1] = newConstNode;
  }

  substeps.push(mathNode.Status.nodeChanged(changeType, node, newNode));
  newNode = mathNode.Status.resetChangeGroups(newNode);

  // If we changed an integer to a fraction, we need to add the steps for
  // adding the fractions.
  if (changeType === ChangeTypes.CONVERT_INTEGER_TO_FRACTION) {
    const addFractionStatus = addConstantFractions(newNode);
    substeps = substeps.concat(addFractionStatus.substeps);
  }
  // Otherwise, add the two constants
  else {
    const evalNode = mathNode.Creator.constant(evaluate(newNode));
    substeps.push(mathNode.Status.nodeChanged(
      ChangeTypes.SIMPLIFY_ARITHMETIC, newNode, evalNode));
  }

  const lastStep = substeps[substeps.length - 1];
  newNode = mathNode.Status.resetChangeGroups(lastStep.newNode);

  return mathNode.Status.nodeChanged(
    ChangeTypes.SIMPLIFY_ARITHMETIC, node, newNode, true, substeps);
}

export = addConstantAndFraction;
