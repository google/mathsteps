const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// e.g. x * -1 -> -x
const REMOVE_MULTIPLYING_BY_NEGATIVE_ONE = defineRuleString('#a * -1', '-#a')

// e.g. -1 * x -> -x
const REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE = defineRuleString('-1 * #a', '-#a')

// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a Node.Status object.
function removeMultiplicationByNegativeOne(node) {
    let newNode = null;
    newNode = rewriteNode(REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node);
    if (!newNode) {
        newNode = rewriteNode(REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE, node);
    }
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = removeMultiplicationByNegativeOne;

