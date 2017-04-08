import mathNode = require('./mathNode');

class TreeSearch {

// Returns a function that performs a preorder search on the tree for the given
// simplifcation function
    preOrder = simplificationFunction => node => search(simplificationFunction, node, true);

// Returns a function that performs a postorder search on the tree for the given
// simplifcation function
    postOrder = simplificationFunction => node => search(simplificationFunction, node, false);

// A helper function for performing a tree search with a function

    search(simplificationFunction, node, preOrder) {
        let status;

        if (preOrder) {
            status = simplificationFunction(node);
            if (status.hasChanged()) {
                return status;
            }
        }

        if (mathNode.Type.isConstant(node) || mathNode.Type.isSymbol(node)) {
            return mathNode.Status.noChange(node);
        } else if (mathNode.Type.isUnaryMinus(node)) {
            status = this.search(simplificationFunction, node.args[0], preOrder);
            if (status.hasChanged()) {
                return mathNode.Status.childChanged(node, status);
            }
        } else if (mathNode.Type.isOperator(node) || mathNode.Type.isFunction(node)) {
            for (let i = 0; i < node.args.length; i++) {
                const child = node.args[i];
                const childNodeStatus = search(simplificationFunction, child, preOrder);
                if (childNodeStatus.hasChanged()) {
                    return mathNode.Status.childChanged(node, childNodeStatus, i);
                }
            }
        } else if (mathNode.Type.isParenthesis(node)) {
            status = search(simplificationFunction, node.content, preOrder);
            if (status.hasChanged()) {
                return mathNode.Status.childChanged(node, status);
            }
        } else {
            throw Error('Unsupported node type: ' + node);
        }

        if (!preOrder) {
            return simplificationFunction(node);
        } else {
            return mathNode.Status.noChange(node);
        }
    }
}

export = TreeSearch;
