const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');

// e.g. x ^ 0 -> 1
const REDUCE_EXPONENT_BY_ZERO = defineRuleString('#a ^ 0', '1')

// If `node` is an exponent of something to 0, we can reduce that to just 1.
// Returns a Node.Status object.
function reduceExponentByZero(node) {
    const newNode = rewriteNode(REDUCE_EXPONENT_BY_ZERO, node);
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.REDUCE_EXPONENT_BY_ZERO, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = reduceExponentByZero;
