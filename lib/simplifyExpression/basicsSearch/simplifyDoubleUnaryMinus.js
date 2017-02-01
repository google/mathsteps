const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node) {
  if (!Node.Type.isUnaryMinus(node)) {
    return Node.Status.noChange(node);
  }
  const unaryArg = node.args[0];
  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (Node.Type.isUnaryMinus(unaryArg)) {
    const newNode = clone(unaryArg.args[0]);
    return Node.Status.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. - -4, -4 could be a constant with negative value
  else if (Node.Type.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
    const newNode = Node.Creator.constant(parseFloat(unaryArg.value) * -1);
    return Node.Status.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. -(-(5+2))
  else if (Node.Type.isParenthesis(unaryArg)) {
    const parenthesisNode = unaryArg;
    const parenthesisContent = parenthesisNode.content;
    if (Node.Type.isUnaryMinus(parenthesisContent)) {
      const newNode = Node.Creator.parenthesis(parenthesisContent.args[0]);
      return Node.Status.nodeChanged(
        ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
    }
  }
  return Node.Status.noChange(node);
}

module.exports = simplifyDoubleUnaryMinus;
