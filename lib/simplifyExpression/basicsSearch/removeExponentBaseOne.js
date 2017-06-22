const {query: q} = require('math-nodes');
const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');
const checks = require('../../checks');

// e.g. 1 ^ x -> 1
const REMOVE_EXPONENT_BASE_ONE = defineRuleString('1 ^ #a', '1')

// If `node` is of the form 1^x, reduces it to a node of the form 1.
// Returns a Node.Status object.
function removeExponentBaseOne(node) {
    const newNode = rewriteNode(REMOVE_EXPONENT_BASE_ONE, node);
    if (newNode && checks.resolvesToConstant(node.args[1])) {
        return Node.Status.nodeChanged(
            ChangeTypes.REMOVE_EXPONENT_BASE_ONE, node, newNode);
    }
    else {
        return Node.Status.noChange(node);
    }
}

module.exports = removeExponentBaseOne;
