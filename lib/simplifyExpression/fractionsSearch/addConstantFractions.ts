import { divideByGCD } from "./divideByGCD";
import * as math from "mathjs";

import { ChangeTypes } from "../../ChangeTypes";
import { evaluate } from "../../util/evaluate";
import { NodeType } from "../../node/NodeType";
import { NodeStatus } from "../../node/NodeStatus";
import { NodeCreator } from "../../node/Creator";

// Adds constant fractions -- can start from either step 1 or 2
// 1A. Find the LCD if denominators are different and multiplies to make
//     denominators equal, e.g. 2/3 + 4/6 --> (2*2)/(3*2) + 4/6
// 1B. Multiplies out to make constant fractions again
//     e.g. (2*2)/(3*2) + 4/6 -> 4/6 + 4/6
// 2A. Combines numerators, e.g. 4/6 + 4/6 ->  e.g. 2/5 + 4/5 --> (2+4)/5
// 2B. Adds numerators together, e.g. (2+4)/5 -> 6/5
// Returns a Status object with substeps
export function addConstantFractions(node) {
  let newNode = node.cloneDeep();

  if (!NodeType.isOperator(node) || node.op !== "+") {
    return NodeStatus.noChange(node);
  }
  if (!node.args.every((n) => NodeType.isIntegerFraction(n, true))) {
    return NodeStatus.noChange(node);
  }
  const denominators = node.args.map((fraction) => {
    return parseFloat(evaluate(fraction.args[1]));
  });

  const substeps = [];
  let status;

  // 1A. First create the common denominator if needed
  // e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
  if (!denominators.every((denominator) => denominator === denominators[0])) {
    status = makeCommonDenominator(newNode);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // 1B. Multiply out the denominators
    status = evaluateDenominators(newNode);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);

    // 1B. Multiply out the numerators
    status = evaluateNumerators(newNode);
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // 2A. Now that they all have the same denominator, combine the numerators
  // e.g. 2/3 + 5/3 -> (2+5)/3
  status = combineNumeratorsAboveCommonDenominator(newNode);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // 2B. Finally, add the numerators together
  status = addNumeratorsTogether(newNode);
  substeps.push(status);
  newNode = NodeStatus.resetChangeGroups(status.newNode);

  // 2C. If the numerator is 0, simplify to just 0
  status = reduceNumerator(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  // 2D. If we can simplify the fraction, do so
  status = divideByGCD(newNode);
  if (status.hasChanged()) {
    substeps.push(status);
    newNode = NodeStatus.resetChangeGroups(status.newNode);
  }

  return NodeStatus.nodeChanged(
    ChangeTypes.ADD_FRACTIONS,
    node,
    newNode,
    true,
    substeps
  );
}

// Given a + operation node with a list of fraction nodes as args that all have
// the same denominator, add them together. e.g. 2/3 + 5/3 -> (2+5)/3
// Returns the new node.
function combineNumeratorsAboveCommonDenominator(node) {
  let newNode = node.cloneDeep();

  const commonDenominator = newNode.args[0].args[1];
  const numeratorArgs = [];
  newNode.args.forEach((fraction) => {
    numeratorArgs.push(fraction.args[0]);
  });
  const newNumerator = NodeCreator.parenthesis(
    NodeCreator.operator("+", numeratorArgs)
  );

  newNode = NodeCreator.operator("/", [newNumerator, commonDenominator]);
  return NodeStatus.nodeChanged(ChangeTypes.COMBINE_NUMERATORS, node, newNode);
}

// Given a node with a numerator that is an addition node, will add
// all the numerators and return the result
function addNumeratorsTogether(node) {
  const newNode = node.cloneDeep();

  newNode.args[0] = NodeCreator.constant(evaluate(newNode.args[0]));
  return NodeStatus.nodeChanged(ChangeTypes.ADD_NUMERATORS, node, newNode);
}

function reduceNumerator(node) {
  let newNode = node.cloneDeep();

  if (newNode.args[0].value === "0") {
    newNode = NodeCreator.constant(0);
    return NodeStatus.nodeChanged(
      ChangeTypes.REDUCE_ZERO_NUMERATOR,
      node,
      newNode
    );
  }

  return NodeStatus.noChange(node);
}

// Takes `node`, a sum of fractions, and returns a node that's a sum of
// fractions with denominators that evaluate to the same common denominator
// e.g. 2/6 + 1/4 -> (2*2)/(6*2) + (1*3)/(4*3)
// Returns the new node.
function makeCommonDenominator(node) {
  const newNode = node.cloneDeep();

  const denominators = newNode.args.map((fraction) => {
    return parseFloat(fraction.args[1].value);
  });
  const commonDenominator = (math.lcm as any)(...denominators);

  newNode.args.forEach((child, i) => {
    // missingFactor is what we need to multiply the top and bottom by
    // so that the denominator is the LCD
    const missingFactor = commonDenominator / denominators[i];
    if (missingFactor !== 1) {
      const missingFactorNode = NodeCreator.constant(missingFactor);
      const newNumerator = NodeCreator.parenthesis(
        NodeCreator.operator("*", [child.args[0], missingFactorNode])
      );
      const newDeominator = NodeCreator.parenthesis(
        NodeCreator.operator("*", [child.args[1], missingFactorNode])
      );
      newNode.args[i] = NodeCreator.operator("/", [
        newNumerator,
        newDeominator,
      ]);
    }
  });

  return NodeStatus.nodeChanged(ChangeTypes.COMMON_DENOMINATOR, node, newNode);
}

function evaluateDenominators(node) {
  const newNode = node.cloneDeep();

  newNode.args.map((fraction) => {
    fraction.args[1] = NodeCreator.constant(evaluate(fraction.args[1]));
  });

  return NodeStatus.nodeChanged(
    ChangeTypes.MULTIPLY_DENOMINATORS,
    node,
    newNode
  );
}

function evaluateNumerators(node) {
  const newNode = node.cloneDeep();

  newNode.args.map((fraction) => {
    fraction.args[0] = NodeCreator.constant(evaluate(fraction.args[0]));
  });

  return NodeStatus.nodeChanged(ChangeTypes.MULTIPLY_NUMERATORS, node, newNode);
}
