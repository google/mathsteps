import clone = require('../../util/clone');
import ChangeTypes = require('../../ChangeTypes');
const mathNode = require('../../node');

// If `node` is a multiplication node with 1 as one of its operands,
// remove 1 from the operands list. Returns a mathNode.Status object.
function removeMultiplicationByOne(node: any);
function removeMultiplicationByOne(node) {
  if (node.op !== '*') {
    return mathNode.Status.noChange(node);
  }
  const oneIndex = node.args.findIndex(arg => {
    return mathNode.Type.isConstant(arg) && arg.value === '1';
  });
  if (oneIndex >= 0) {
    let newNode = clone(node);
    // remove the 1 node
    newNode.args.splice(oneIndex, 1);
    // if there's only one operand left, there's nothing left to multiply it
    // to, so move it up the tree
    if (newNode.args.length === 1) {
      newNode = newNode.args[0];
    }
    return mathNode.Status.nodeChanged(
      ChangeTypes.REMOVE_MULTIPLYING_BY_ONE, node, newNode);
  }
  return mathNode.Status.noChange(node);
}

export = removeMultiplicationByOne;
