import checks = require("../../checks");
import clone = require("../../util/clone");
import ChangeTypes = require("../../ChangeTypes");
import mathNode = require("../../mathnode");

// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a mathNode.Status object.
function removeExponentBaseOne(node: mathjs.MathNode) {
  if (node.op === "^" &&                         // an exponent with
      checks.resolvesToConstant(node.args[1]) && // a power not a symbol and
      mathNode.Type.isConstant(node.args[0]) &&      // a constant base
      node.args[0].value === "1") {              // of value 1
    const newNode = clone(node.args[0]);
    return mathNode.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BASE_ONE, node, newNode);
  }
  return mathNode.Status.noChange(node);
}

export = removeExponentBaseOne;
