import clone = require('../../util/clone');
import math = require('mathjs');
import ChangeTypes = require('../../ChangeTypes');
import evaluate = require('../../util/evaluate');
const mathNode = require('../../node');

// Evaluates abs() function if it's on a single constant value.
// Returns a mathNode.Status object.
function absoluteValue(node: any);
function absoluteValue(node) {
  if (!mathNode.Type.isFunction(node, 'abs')) {
    return mathNode.Status.noChange(node);
  }
  if (node.args.length > 1) {
    return mathNode.Status.noChange(node);
  }
  let newNode = clone(node);
  const argument = newNode.args[0];
  if (mathNode.Type.isConstant(argument, true)) {
    newNode = mathNode.Creator.constant(math.abs(evaluate(argument)));
    return mathNode.Status.nodeChanged(
      ChangeTypes.ABSOLUTE_VALUE, node, newNode);
  }
  else if (mathNode.Type.isConstantFraction(argument, true)) {
    const newNumerator = mathNode.Creator.constant(
      math.abs(evaluate(argument.args[0])));
    const newDenominator =  mathNode.Creator.constant(
      math.abs(evaluate(argument.args[1])));
    newNode = mathNode.Creator.operator('/', [newNumerator, newDenominator]);
    return mathNode.Status.nodeChanged(
      ChangeTypes.ABSOLUTE_VALUE, node, newNode);
  }
  else {
    return mathNode.Status.noChange(node);
  }
}

export = absoluteValue;
