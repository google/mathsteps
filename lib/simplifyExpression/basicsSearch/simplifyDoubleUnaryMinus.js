const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

const RESOLVE_DOUBLE_MINUS = defineRuleString('--#a', '#a')

// Simplifies two unary minuses in a row by removing both of them.
// e.g. -(- 4) --> 4
function simplifyDoubleUnaryMinus(node) {
    const newNode = rewriteNode(RESOLVE_DOUBLE_MINUS, node);
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.RESOLVE_DOUBLE_MINUS, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = simplifyDoubleUnaryMinus;
