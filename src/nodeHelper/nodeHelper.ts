///<reference path="../util/ChangeTypes.ts" />
///<reference path = "../classes.ts" />

namespace nodeHelper {

    export class Status {
        changeType: ChangeTypes;
        oldNode: mNode;
        newNode: mNode;
        substeps: any;
        constructor(changeType: ChangeTypes, oldNode: mNode, newNode: mNode, substeps = []) {
            if (!newNode) {
                throw Error('node is not defined');
            }
            if (changeType === undefined || typeof (changeType) !== 'string') {
                throw Error('changetype isn\'t valid');
            }

            this.changeType = changeType;
            this.oldNode = oldNode;
            this.newNode = newNode;
            this.substeps = substeps;
        }
        hasChanged() {
            return this.changeType !== ChangeTypes.NO_CHANGE;
        }
        resetChangeGroups = function (node: mNode) {
            node = clone(node);
            node.filter(node => node.changeGroup).forEach(change => {
                delete change.changeGroup;
            });
            return node;
        };

        // A wrapper around the Status constructor for the case where node hasn't
        // been changed.
        noChange(node: mNode) {
            return new Status(ChangeTypes.NO_CHANGE, null, node);
        };

        // A wrapper around the Status constructor for the case of a change
        // that is happening at the level of oldNode + newNode
        // e.g. 2 + 2 --> 4 (an addition node becomes a constant node)
        nodeChanged(
            changeType: ChangeTypes, oldNode: mNode, newNode: mNode, defaultChangeGroup = true, steps = []) {
            if (defaultChangeGroup) {
                oldNode.changeGroup = 1;
                newNode.changeGroup = 1;
            }

            return new Status(changeType, oldNode, newNode, steps);
        };

        // A wrapper around the Status constructor for the case where there was
        // a change that happened deeper `node`'s tree, and `node`'s children must be
        // updated to have the newNode/oldNode metadata (changeGroups)
        // e.g. (2 + 2) + x --> 4 + x has to update the left argument
        childChanged(node: mNode, childStatus, childArgIndex = null) {
            const oldNode = clone(node);
            const newNode = clone(node);
            let substeps = childStatus.substeps;

            if (!childStatus.oldNode) {
                throw Error('Expected old node for changeType: ' + childStatus.changeType);
            }

            function updateSubsteps(substeps, fn) {
                substeps.map((step) => {
                    step = fn(step);
                    step.substeps = updateSubsteps(step.substeps, fn);
                });
                return substeps;
            }

            if (Type.isParenthesis(node)) {
                oldNode.content = childStatus.oldNode;
                newNode.content = childStatus.newNode;
                substeps = updateSubsteps(substeps, (step) => {
                    const oldNode = clone(node);
                    const newNode = clone(node);
                    oldNode.content = step.oldNode;
                    newNode.content = step.newNode;
                    step.oldNode = oldNode;
                    step.newNode = newNode;
                    return step;
                });
            }
            else if ((Type.isOperator(node) || Type.isFunction(node) &&
                childArgIndex !== null)) {
                oldNode.args[childArgIndex] = childStatus.oldNode;
                newNode.args[childArgIndex] = childStatus.newNode;
                substeps = updateSubsteps(substeps, (step) => {
                    const oldNode = clone(node);
                    const newNode = clone(node);
                    oldNode.args[childArgIndex] = step.oldNode;
                    newNode.args[childArgIndex] = step.newNode;
                    step.oldNode = oldNode;
                    step.newNode = newNode;
                    return step;
                });
            }
            else if (Type.isUnaryMinus(node)) {
                oldNode.args[0] = childStatus.oldNode;
                newNode.args[0] = childStatus.newNode;
                substeps = updateSubsteps(substeps, (step) => {
                    const oldNode = clone(node);
                    const newNode = clone(node);
                    oldNode.args[0] = step.oldNode;
                    newNode.args[0] = step.newNode;
                    step.oldNode = oldNode;
                    step.newNode = newNode;
                    return step;
                });
            }
            else {
                throw Error('Unexpected node type: ' + node.type);
            }

            return new Status(childStatus.changeType, oldNode, newNode, substeps);
        };
    }
    class Creator {
        /*
  Functions to generate any mathJS node supported by the stepper
  see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
  information on nodes in mathJS
*/
        class NodeCreator {
        operator(op, args, implicit = false) {
            switch (op) {
                case '+':
                    return new math.expression.node.OperatorNode('+', 'add', args);
                case '-':
                    return new math.expression.node.OperatorNode('-', 'subtract', args);
                case '/':
                    return new math.expression.node.OperatorNode('/', 'divide', args);
                case '*':
                    return new math.expression.node.OperatorNode(
                        '*', 'multiply', args, implicit);
                case '^':
                    return new math.expression.node.OperatorNode('^', 'pow', args);
                default:
                    throw Error('Unsupported operation: ' + op);
            }
        }

        // In almost all cases, use Negative.negate (with naive = true) to add a
        // unary minus to your node, rather than calling this constructor directly
        unaryMinus(content) {
            return new math.expression.node.OperatorNode(
                '-', 'unaryMinus', [content]);
        }

        constant(val) {
            return new math.expression.node.ConstantNode(val);
        }

        symbol(name) {
            return new math.expression.node.SymbolNode(name);
        }

        parenthesis(content) {
            return new math.expression.node.ParenthesisNode(content);
        }

        // exponent might be null, which means there's no exponent node.
        // similarly, coefficient might be null, which means there's no coefficient
        // the symbol node can never be null.
        polynomialTerm(symbol, exponent, coeff, explicitCoeff = false) {
            let polyTerm = symbol;
            if (exponent) {
                polyTerm = this.operator('^', [polyTerm, exponent]);
            }
            if (coeff && (explicitCoeff || parseFloat(coeff.value) !== 1)) {
                if (NodeType.isConstant(coeff) &&
                    parseFloat(coeff.value) === -1 &&
                    !explicitCoeff) {
                    // if you actually want -1 as the coefficient, set explicitCoeff to true
                    polyTerm = this.unaryMinus(polyTerm);
                }
                else {
                    polyTerm = this.operator('*', [coeff, polyTerm], true);
                }
            }
            return polyTerm;
        }

        // Given a root value and a radicand (what is under the radical)
        nthRoot(radicandNode, rootNode) {
            const symbol = NodeCreator.symbol('nthRoot');
            return new math.expression.node.FunctionNode(symbol, [radicandNode, rootNode]);
        }
    };
}
    /*
For determining the type of a mathJS node.
*/
    class NodeType {

    static isOperator(node: mNode, operator = null) {
        return node.type === 'OperatorNode' &&
            node.fn !== 'unaryMinus' &&
            "*+-/^".includes(node.op) &&
            (operator ? node.op === operator : true);
    };

    static isParenthesis(node: mNode) {
        return node.type === 'ParenthesisNode';
    };

    static isUnaryMinus = function (node: mNode) {
        return node.type === 'OperatorNode' && node.fn === 'unaryMinus';
    };

    static isFunction = function (node: mNode, functionName = null) {
        if (node.type !== 'FunctionNode') {
            return false;
        }
        if (functionName && node.fn.name !== functionName) {
            return false;
        }
        return true;
    };

    static isSymbol(node: mNode, allowUnaryMinus = true): boolean {
        if (node.type === 'SymbolNode') {
            return true;
        }
        else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
            return NodeType.isSymbol(node.args[0], false);
        }
        else {
            return false;
        }
    };

    static isConstant(node: mNode, allowUnaryMinus = false) {
        if (node.type === 'ConstantNode') {
            return true;
        }
        else if (allowUnaryMinus && NodeType.isUnaryMinus(node)) {
            if (NodeType.isConstant(node.args[0], false)) {
                const value = parseFloat(node.args[0].value);
                return value >= 0;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    };

    static isConstantFraction(node: mNode, allowUnaryMinus = false) {
        if (NodeType.isOperator(node, '/')) {
            return node.args.every(n => NodeType.isConstant(n, allowUnaryMinus));
        }
        else {
            return false;
        }
    };

    static isConstantOrConstantFraction(node: mNode, allowUnaryMinus = false) {
        if (NodeType.isConstant(node, allowUnaryMinus) ||
            NodeType.isConstantFraction(node, allowUnaryMinus)) {
            return true;
        }
        else {
            return false;
        }
    };

    static isIntegerFraction(node: mNode, allowUnaryMinus = false) {
        if (!NodeType.isConstantFraction(node, allowUnaryMinus)) {
            return false;
        }
        let numerator = node.args[0];
        let denominator = node.args[1];
        if (allowUnaryMinus) {
            if (NodeType.isUnaryMinus(numerator)) {
                numerator = numerator.args[0];
            }
            if (NodeType.isUnaryMinus(denominator)) {
                denominator = denominator.args[0];
            }
        }
        return (Number.isInteger(parseFloat(numerator.value)) &&
            Number.isInteger(parseFloat(denominator.value)));
    };

    }
class PolynomialTerm {

}