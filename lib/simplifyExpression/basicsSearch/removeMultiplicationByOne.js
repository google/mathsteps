const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is a multiplication node with 1 as one of its operands,
// remove 1 from the operands list. Returns a Node.Status object.
function removeMultiplicationByOne(node) {
  if (node.op !== '*') {
    return Node.Status.noChange(node);
  }
  const oneIndex = node.args.findIndex(arg => {
    return Node.Type.isConstant(arg) && arg.value === '1';
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
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_MULTIPLYING_BY_ONE, node, newNode);
  }
  return Node.Status.noChange(node);
}

module.exports = removeMultiplicationByOne;
