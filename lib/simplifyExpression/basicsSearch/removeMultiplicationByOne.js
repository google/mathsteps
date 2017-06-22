const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// e.g. x * 1 -> x
const REMOVE_MULTIPLYING_BY_ONE = defineRuleString('#a * 1', '#a')

// e.g. 1 * x -> x
const REMOVE_MULTIPLYING_BY_ONE_REVERSE = defineRuleString('1 * #a', '#a')

// If `node` is a multiplication node with 1 as one of its operands,
// remove 1 from the operands list. Returns a Node.Status object.
function removeMultiplicationByOne(node) {
    let newNode = null;
    newNode = rewriteNode(REMOVE_MULTIPLYING_BY_ONE, node);
    if (!newNode) {
        newNode = rewriteNode(REMOVE_MULTIPLYING_BY_ONE_REVERSE, node);
    }
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.REMOVE_MULTIPLYING_BY_ONE, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = removeMultiplicationByOne;

