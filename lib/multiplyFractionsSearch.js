'use strict';

const MathChangeTypes = require('./MathChangeTypes');
const NodeCreator = require('./util/NodeCreator');
const NodeStatus = require('./util/NodeStatus');
const NodeType = require('./util/NodeType');
const PolynomialTermNode = require('./PolynomialTermNode');
const TreeSearch = require('./util/TreeSearch');

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// TODO: add a step somewhere to remove common terms in numerator and
// denominator (so the 5s would cancel out on the next step after this)
// This step must happen after things have been distributed, or else the answer
// will be formatted badly, so it's a tree search of its own.
// Returns a NodeStatus object.
const multiplyFractionsSearch = TreeSearch.postOrder(multiplyFractions);

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// Returns a NodeStatus object.
function multiplyFractions(node) {
  if (!NodeType.isOperator(node) || node.op !== '*') {
    return NodeStatus.noChange(node);
  }
  const atLeastOneFraction = node.args.some(
    arg => NodeType.isOperator(arg) && arg.op === '/');
  const hasPolynomialTerms = node.args.some(
    arg => PolynomialTermNode.isPolynomialTerm(arg));
  if (!atLeastOneFraction || hasPolynomialTerms) {
    return NodeStatus.noChange(node);
  }

  let numeratorArgs = [];
  let denominatorArgs = [];
  node.args.forEach(operand => {
    if (NodeType.isOperator(operand) && operand.op === '/') {
      numeratorArgs.push(operand.args[0]);
      denominatorArgs.push(operand.args[1]);
    }
    else {
      numeratorArgs.push(operand);
    }
  });

  const newNumerator = NodeCreator.parenthesis(
    NodeCreator.operator('*', numeratorArgs));
  const newDenominator = denominatorArgs.length === 1
    ? denominatorArgs[0]
    : NodeCreator.parenthesis(NodeCreator.operator('*', denominatorArgs));

  const newNode = NodeCreator.operator('/', [newNumerator, newDenominator]);
  return NodeStatus.nodeChanged(
    MathChangeTypes.MULTIPLY_FRACTIONS, node, newNode);
}

module.exports = multiplyFractionsSearch;
