import clone = require('../../util/clone');
import ChangeTypes = require('../../ChangeTypes');
import mathNode = require('../../mathnode');

// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a mathNode.Status object.
function removeExponentByOne(node: any);
function removeExponentByOne(node) {
  if (node.op === '^' &&                   // exponent of anything
      mathNode.Type.isConstant(node.args[1]) && // to a constant
      node.args[1].value === '1') {        // of value 1
    const newNode = clone(node.args[0]);
    return mathNode.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BY_ONE, node, newNode);
  }
  return mathNode.Status.noChange(node);
}

export = removeExponentByOne;
