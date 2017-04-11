import clone = require("../../util/clone");
import ChangeTypes = require("../../ChangeTypes");
import mathNode = require("../../mathnode");

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node: mathjs.MathNode) {
  if (!mathNode.Type.isUnaryMinus(node)) {
    return mathNode.Status.noChange(node);
  }
  const unaryArg = node.args[0];
  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (mathNode.Type.isUnaryMinus(unaryArg)) {
    const newNode = clone(unaryArg.args[0]);
    return mathNode.Status.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. - -4, -4 could be a constant with negative value
  else if (mathNode.Type.isConstant(unaryArg) && parseFloat(unaryArg.value) < 0) {
    const newNode = mathNode.Creator.constant(parseFloat(unaryArg.value) * -1);
    return mathNode.Status.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. -(-(5+2))
  else if (mathNode.Type.isParenthesis(unaryArg)) {
    const parenthesisNode = unaryArg;
    const parenthesisContent = parenthesisNode;
    if (mathNode.Type.isUnaryMinus(parenthesisContent)) {
      const newNode = mathNode.Creator.parenthesis(parenthesisContent.args[0]);
      return mathNode.Status.nodeChanged(
        ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
    }
  }
  return mathNode.Status.noChange(node);
}

export = simplifyDoubleUnaryMinus;
