const {rewriteNode} = require('math-rules');

const ChangeTypes = require('../../ChangeTypes');
const Negative = require('../../Negative');
const defineRuleString = require('../../util/defineRuleString');
const Node = require('../../node');
const {build} = require('math-nodes');
const simplifyDoubleUnaryMinus = require('./simplifyDoubleUnaryMinus');

// e.g. 2/-1 -> -2
const DIVISION_BY_NEGATIVE_ONE = defineRuleString('#a / -1', '-#a')

// e.g. 2/1 -> 2
const DIVISION_BY_ONE = defineRuleString('#a / 1', '#a')

// If `node` is a division operation of something by 1 or -1, we can remove the
// denominator. Returns a Node.Status object.
function removeDivisionByOne(node) {
    let newNode = null;
    newNode = rewriteNode(DIVISION_BY_ONE, node);
    if (newNode) {
        return Node.Status.nodeChanged(
            ChangeTypes.DIVISION_BY_ONE, node, newNode);
    }

    let numerator = node.args[0];
    if (numerator.op == 'neg') {
        return simplifyDoubleUnaryMinus(build.neg(numerator));
    } else {
        newNode = rewriteNode(DIVISION_BY_NEGATIVE_ONE, node);

        if (newNode) {
            return Node.Status.nodeChanged(
                ChangeTypes.DIVISION_BY_NEGATIVE_ONE, node, newNode);
        } else {
            return Node.Status.noChange(node);
        }
    }
}

module.exports = removeDivisionByOne;
