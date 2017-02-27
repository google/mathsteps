const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is an addition node with 0 as one of its operands,
// remove 0 from the operands list. Returns a Node.Status object.
function removeAdditionOfZero(node) {
  if (node.op !== '+') {
    return Node.Status.noChange(node);
  }
  const zeroIndex = node.args.findIndex(arg => {
    return Node.Type.isConstant(arg) && arg.value === '0';
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
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_ADDING_ZERO, node, newNode);
  }
  return Node.Status.noChange(node);
}

module.exports = removeAdditionOfZero;
