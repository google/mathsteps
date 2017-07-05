const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const {build, query} = require('math-nodes');

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node) {
  if (!query.isNeg(node)) {
    return Node.Status.noChange(node);
  }
  const unaryArg = node.args[0];
  const val = query.getValue(unaryArg);
  // e.g. in - -x, -x is the unary arg, and we'd want to reduce to just x
  if (query.isNeg(unaryArg)) {
    const newNode = clone(unaryArg.args[0]);
    return Node.Status.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  // e.g. - -4, -4 could be a constant with negative value
  else if (query.isNumber(unaryArg) && parseFloat(val) < 0) {
    const newNode = build.number(parseFloat(val) * -1);
    return Node.Status.nodeChanged(
      ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
  }
  return Node.Status.noChange(node);
}

module.exports = simplifyDoubleUnaryMinus;
