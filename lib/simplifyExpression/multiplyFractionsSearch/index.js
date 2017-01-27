'use strict';

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const TreeSearch = require('../../TreeSearch');

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// TODO: add a step somewhere to remove common terms in numerator and
// denominator (so the 5s would cancel out on the next step after this)
// This step must happen after things have been distributed, or else the answer
// will be formatted badly, so it's a tree search of its own.
// Returns a Node.Status object.
const search = TreeSearch.postOrder(multiplyFractions);

// If `node` is a product of terms where some are fractions (but none are
// polynomial terms), multiplies them together.
// e.g. 2 * 5/x -> (2*5)/x
// e.g. 3 * 1/5 * 5/9 = (3*1*5)/(5*9)
// Returns a Node.Status object.
function multiplyFractions(node) {
  if (!Node.Type.isOperator(node) || node.op !== '*') {
    return Node.Status.noChange(node);
  }
  const atLeastOneFraction = node.args.some(
    arg => Node.Type.isOperator(arg, '/'));
  const hasPolynomialTerms = node.args.some(
    arg => Node.PolynomialTerm.isPolynomialTerm(arg));
  if (!atLeastOneFraction || hasPolynomialTerms) {
    return Node.Status.noChange(node);
  }

  const numeratorArgs = [];
  const denominatorArgs = [];
  node.args.forEach(operand => {
    if (Node.Type.isOperator(operand, '/')) {
      numeratorArgs.push(operand.args[0]);
      denominatorArgs.push(operand.args[1]);
    }
    else {
      numeratorArgs.push(operand);
    }
  });

  const newNumerator = Node.Creator.parenthesis(
    Node.Creator.operator('*', numeratorArgs));
  const newDenominator = denominatorArgs.length === 1
    ? denominatorArgs[0]
    : Node.Creator.parenthesis(Node.Creator.operator('*', denominatorArgs));

  const newNode = Node.Creator.operator('/', [newNumerator, newDenominator]);
  return Node.Status.nodeChanged(
    ChangeTypes.MULTIPLY_FRACTIONS, node, newNode);
}

module.exports = search;
