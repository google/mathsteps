const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// e.g. x ^ 1 -> x
const REMOVE_EXPONENT_BY_ONE = defineRuleString('#a ^ 1', '#a')

// If `node` is of the form x^1, reduces it to a node of the form x.
// Returns a Node.Status object.
function removeExponentByOne(node) {
    const newNode = rewriteNode(REMOVE_EXPONENT_BY_ONE, node);
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.REMOVE_EXPONENT_BY_ONE, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = removeExponentByOne;

