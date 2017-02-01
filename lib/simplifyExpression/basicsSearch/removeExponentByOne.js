const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');

// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a Node.Status object.
function removeExponentByOne(node) {
  if (node.op === '^' &&                   // exponent of anything
      Node.Type.isConstant(node.args[1]) && // to a constant
      node.args[1].value === '1') {        // of value 1
    const newNode = clone(node.args[0]);
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BY_ONE, node, newNode);
  }
  return Node.Status.noChange(node);
}

module.exports = removeExponentByOne;
