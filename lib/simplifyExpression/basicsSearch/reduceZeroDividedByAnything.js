//const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

const REDUCE_ZERO_NUMERATOR = defineRuleString('0 / #a', '0')

// If `node` is a fraction with 0 as the numerator, reduce the node to 0.
// Returns a Node.Status object.
function reduceExponentByZero(node) {
    const newNode = rewriteNode(REDUCE_ZERO_NUMERATOR, node);
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.REDUCE_ZERO_NUMERATOR, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = reduceExponentByZero;
