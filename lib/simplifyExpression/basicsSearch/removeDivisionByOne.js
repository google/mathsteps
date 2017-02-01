const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const Node = require('../../node');

// If `node` is a division operation of something by 1 or -1, we can remove the
// denominator. Returns a Node.Status object.
function removeDivisionByOne(node) {
  if (node.op !== '/') {
    return Node.Status.noChange(node);
  }
  const denominator = node.args[1];
  if (!Node.Type.isConstant(denominator)) {
    return Node.Status.noChange(node);
  }
  let numerator = clone(node.args[0]);

  // if denominator is -1, we make the numerator negative
  if (parseFloat(denominator.value) === -1) {
    // If the numerator was an operation, wrap it in parens before adding -
    // to the front.
    // e.g. 2+3 / -1 ---> -(2+3)
    if (Node.Type.isOperator(numerator)) {
      numerator = Node.Creator.parenthesis(numerator);
    }
    const changeType = Negative.isNegative(numerator) ?
      ChangeTypes.RESOLVE_DOUBLE_MINUS :
      ChangeTypes.DIVISION_BY_NEGATIVE_ONE;
    numerator = Negative.negate(numerator);
    return Node.Status.nodeChanged(changeType, node, numerator);
  }
  else if (parseFloat(denominator.value) === 1) {
    return Node.Status.nodeChanged(
      ChangeTypes.DIVISION_BY_ONE, node, numerator);
  }
  else {
    return Node.Status.noChange(node);
  }
}

module.exports = removeDivisionByOne;
