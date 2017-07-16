const clone = require('../../util/clone');
const math = require('mathjs');

const ChangeTypes = require('../../ChangeTypes');
const evaluate = require('../../util/evaluate');
const Node = require('../../node');

// Evaluates abs() function if it's on a single constant value.
// Returns a Node.Status object.
function absoluteValue(node) {
  if (!Node.Type.isFunction(node, 'abs')) {
    return Node.Status.noChange(node);
  }
  if (node.args.length > 1) {
    return Node.Status.noChange(node);
  }
  let newNode = clone(node);
  const argument = newNode.args[0];
  if (Node.Type.isConstant(argument, true)) {
    newNode = Node.Creator.constant(math.abs(evaluate(argument)));
    return Node.Status.nodeChanged(
      ChangeTypes.ABSOLUTE_VALUE, node, newNode);
  }
  else if (Node.Type.isConstantFraction(argument, true)) {
    const newNumerator = Node.Creator.constant(
      math.abs(evaluate(argument.args[0])));
    const newDenominator =  Node.Creator.constant(
      math.abs(evaluate(argument.args[1])));
    newNode = Node.Creator.operator('/', [newNumerator, newDenominator]);
    return Node.Status.nodeChanged(
      ChangeTypes.ABSOLUTE_VALUE, node, newNode);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = absoluteValue;
