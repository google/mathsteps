const checks = require('../../checks');
const clone = require('../../util/clone');

const ChangeTypes = require('../../ChangeTypes');
const Node = require('../../node');
const {query} = require('math-nodes');

// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a Node.Status object.
function removeExponentBaseOne(node) {
  if (query.isPow(node) &&                         // an exponent with
      checks.resolvesToConstant(node.args[1]) && // a power not a symbol and
      query.isNumber(node.args[0]) &&      // a constant base
      query.getValue(node.args[0]) === 1) {              // of value 1
    const newNode = clone(node.args[0]);
    return Node.Status.nodeChanged(
      ChangeTypes.REMOVE_EXPONENT_BASE_ONE, node, newNode);
  }
  return Node.Status.noChange(node);
}

module.exports = removeExponentBaseOne;
