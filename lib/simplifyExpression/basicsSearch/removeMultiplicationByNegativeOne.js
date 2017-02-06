const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const Node = require('../../node');

// If `node` is a multiplication node with -1 as one of its operands,
// and a non constant as the next operand, remove -1 from the operands
// list and make the next term have a unary minus.
// Returns a Node.Status object.
function removeMultiplicationByNegativeOne(node) {
  if (node.op !== '*') {
    return Node.Status.noChange(node);
  }
  const minusOneIndex = node.args.findIndex(arg => {
    return Node.Type.isConstant(arg) && arg.value === '-1';
  });
  if (minusOneIndex < 0) {
    return Node.Status.noChange(node);
  }

  // We might merge/combine the negative one into another node. This stores
  // the index of that other node in the arg list.
  let nodeToCombineIndex;
  // If minus one is the last term, maybe combine with the term before
  if (minusOneIndex + 1 === node.args.length) {
    nodeToCombineIndex = minusOneIndex - 1;
  }
  else {
    nodeToCombineIndex = minusOneIndex + 1;
  }

  let nodeToCombine = node.args[nodeToCombineIndex];
  // If it's a constant, the combining of those terms is handled elsewhere.
  if (Node.Type.isConstant(nodeToCombine)) {
    return Node.Status.noChange(node);
  }

  let newNode = clone(node);

  // Get rid of the -1
  nodeToCombine = Negative.negate(clone(nodeToCombine));

  // replace the node next to -1 and remove -1
  newNode.args[nodeToCombineIndex] = nodeToCombine;
  newNode.args.splice(minusOneIndex, 1);

  // if there's only one operand left, move it up the tree
  if (newNode.args.length === 1) {
    newNode = newNode.args[0];
  }
  return Node.Status.nodeChanged(
    ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node, newNode);
}

module.exports = removeMultiplicationByNegativeOne;
