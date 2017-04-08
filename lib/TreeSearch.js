"use strict";
var mathNode = require("./mathNode");
var TreeSearch = (function () {
    function TreeSearch() {
        var _this = this;
        // Returns a function that performs a preorder search on the tree for the given
        // simplifcation function
        this.preOrder = function (simplificationFunction) { return function (node) { return _this.search(simplificationFunction, node, true); }; };
        // Returns a function that performs a postorder search on the tree for the given
        // simplifcation function
        this.postOrder = function (simplificationFunction) { return function (node) { return _this.search(simplificationFunction, node, false); }; };
    }
    // A helper function for performing a tree search with a function
    TreeSearch.prototype.search = function (simplificationFunction, node, preOrder) {
        var status;
        if (preOrder) {
            status = simplificationFunction(node);
            if (status.hasChanged()) {
                return status;
            }
        }
        if (mathNode.Type.isConstant(node) || mathNode.Type.isSymbol(node)) {
            return mathNode.Status.noChange(node);
        }
        else if (mathNode.Type.isUnaryMinus(node)) {
            status = this.search(simplificationFunction, node.args[0], preOrder);
            if (status.hasChanged()) {
                return mathNode.Status.childChanged(node, status);
            }
        }
        else if (mathNode.Type.isOperator(node) || mathNode.Type.isFunction(node)) {
            for (var i = 0; i < node.args.length; i++) {
                var child = node.args[i];
                var childNodeStatus = this.search(simplificationFunction, child, preOrder);
                if (childNodeStatus.hasChanged()) {
                    return mathNode.Status.childChanged(node, childNodeStatus, i);
                }
            }
        }
        else if (mathNode.Type.isParenthesis(node)) {
            status = this.search(simplificationFunction, node.content, preOrder);
            if (status.hasChanged()) {
                return mathNode.Status.childChanged(node, status);
            }
        }
        else {
            throw Error('Unsupported node type: ' + node);
        }
        if (!preOrder) {
            return simplificationFunction(node);
        }
        else {
            return mathNode.Status.noChange(node);
        }
    };
    return TreeSearch;
}());
module.exports = TreeSearch;
//# sourceMappingURL=TreeSearch.js.map