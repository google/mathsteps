import clone = require('../../util/clone');
import ChangeTypes = require('../../ChangeTypes');
const mathNode = require('../../node');

// If `node` is an addition node with 0 as one of its operands,
// remove 0 from the operands list. Returns a mathNode.Status object.
function removeAdditionOfZero(node: any);
function removeAdditionOfZero(node) {
  if (node.op !== '+') {
    return mathNode.Status.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    return mathNode.Type.isConstant(arg) && arg.value === '0';
  });
  let newNode = clone(node);
  if (zeroIndex >= 0) {
    // remove the 0 node
    newNode.args.splice(zeroIndex, 1);
    // if there's only one operand left, there's nothing left to add it to,
    // so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return mathNode.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  return mathNode.Status.noChange(node);
}

export = removeAdditionOfZero;
