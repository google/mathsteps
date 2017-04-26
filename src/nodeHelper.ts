///<reference path="ChangeTypes.ts" />
///<reference path = "classes.ts" />

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
    static resetChangeGroups = function (node: mNode) {
        node = clone(node);
        node.filter(node => node.changeGroup).forEach(change => {
            delete change.changeGroup;
        });
        return node;
    };

    // A wrapper around the Status constructor for the case where node hasn't
    // been changed.
    static noChange(node: mNode) {
        return new Status(ChangeTypes.NO_CHANGE, null, node);
    };

    // A wrapper around the Status constructor for the case of a change
    // that is happening at the level of oldNode + newNode
    // e.g. 2 + 2 --> 4 (an addition node becomes a constant node)
    static nodeChanged(
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
    static childChanged(node: mNode, childStatus, childArgIndex = null) {
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
/*
Functions to generate any mathJS node supported by the stepper
see http://mathjs.org/docs/expressions/expression_trees.html#nodes for more
information on nodes in mathJS
*/
export class Creator {
    static operator(op: string, args: mNode[], implicit = false): mNode {
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
    static unaryMinus(content) {
        return new math.expression.node.OperatorNode(
            '-', 'unaryMinus', [content]);
    }

    static constant(val) {
        return new math.expression.node.ConstantNode(val);
    }

    static symbol(name) {
        return new math.expression.node.SymbolNode(name);
    }

    static parenthesis(content) {
        return new math.expression.node.ParenthesisNode(content);
    }

    // exponent might be null, which means there's no exponent node.
    // similarly, coefficient might be null, which means there's no coefficient
    // the symbol node can never be null.
    static polynomialTerm(symbol, exponent, coeff, explicitCoeff = false) {
        let polyTerm = symbol;
        if (exponent) {
            polyTerm = this.operator('^', [polyTerm, exponent]);
        }
        if (coeff && (explicitCoeff || parseFloat(coeff.value) !== 1)) {
            if (Type.isConstant(coeff) &&
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
    static nthRoot(radicandNode: mNode, rootNode: mNode) {
        const symbol = Creator.symbol('nthRoot');
        return new math.expression.node.FunctionNode(symbol, [radicandNode, rootNode]);
    }
};
//For determining the type of a mathJS node.
export class Type {

    static isOperator(node: mNode, operator: string = null) {
        return node.type === 'OperatorNode' &&
            node.fn !== 'unaryMinus' &&
            "*+-/^".indexOf(node.op) >= 0 &&
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
        else if (allowUnaryMinus && Type.isUnaryMinus(node)) {
            return Type.isSymbol(node.args[0], false);
        }
        else {
            return false;
        }
    };

    static isConstant(node: mNode, allowUnaryMinus = false) {
        if (node.type === 'ConstantNode') {
            return true;
        }
        else if (allowUnaryMinus && Type.isUnaryMinus(node)) {
            if (Type.isConstant(node.args[0], false)) {
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
        if (Type.isOperator(node, '/')) {
            return node.args.every(n => Type.isConstant(n, allowUnaryMinus));
        }
        else {
            return false;
        }
    };

    static isConstantOrConstantFraction(node: mNode, allowUnaryMinus = false) {
        if (Type.isConstant(node, allowUnaryMinus) ||
            Type.isConstantFraction(node, allowUnaryMinus)) {
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
export class PolynomialTerm {
    // For storing polynomial terms.
    // Has a symbol (e.g. x), maybe an exponent, and maybe a coefficient.
    // These expressions are of the form of a PolynomialTerm: x^2, 2y, z, 3x/5
    // These expressions are not: 4, x^(3+4), 2+x, 3*7, x-z
    /* Fields:
     - coeff: either a constant node or a fraction of two constant nodes
       (might be null if no coefficient)
     - symbol: the node with the symbol (e.g. in x^2, the node x)
     - exponent: a node that can take any form, e.g. x^(2+x^2)
       (might be null if no exponent)
    */
    // if onlyImplicitMultiplication is true, an error will be thrown if `node`
    // is a polynomial term without implicit multiplication
    // (i.e. 2*x instead of 2x) and therefore isPolynomialTerm will return false.
    //TODO: Add type annotation
    symbol;
    exponent;
    coeff;
    constructor(node: mNode, onlyImplicitMultiplication = false) {
        if (NodeType.isOperator(node)) {
            if (node.op === '^') {
                const symbolNode = node.args[0];
                if (!NodeType.isSymbol(symbolNode)) {
                    throw Error('Expected symbol term, got ' + symbolNode);
                }
                this.symbol = symbolNode;
                this.exponent = node.args[1];
            }
            // it's '*' ie it has a coefficient
            else if (node.op === '*') {
                if (onlyImplicitMultiplication && !node.implicit) {
                    throw Error('Expected implicit multiplication');
                }
                if (node.args.length !== 2) {
                    throw Error('Expected two arguments to *');
                }
                const coeffNode = node.args[0];
                if (!NodeType.isConstantOrConstantFraction(coeffNode)) {
                    throw Error('Expected coefficient to be constant or fraction of ' +
                        'constants term, got ' + coeffNode);
                }
                this.coeff = coeffNode;
                const nonCoefficientTerm = new PolynomialTerm(
                    node.args[1], onlyImplicitMultiplication);
                if (nonCoefficientTerm.hasCoeff()) {
                    throw Error('Cannot have two coefficients ' + coeffNode +
                        ' and ' + nonCoefficientTerm.getCoeffNode());
                }
                this.symbol = nonCoefficientTerm.getSymbolNode();
                this.exponent = nonCoefficientTerm.getExponentNode();
            }
            // this means there's a fraction coefficient
            else if (node.op === '/') {
                const denominatorNode = node.args[1];
                if (!NodeType.isConstant(denominatorNode)) {
                    throw Error('denominator must be constant node, instead of ' +
                        denominatorNode);
                }
                const numeratorNode = new PolynomialTerm(
                    node.args[0], onlyImplicitMultiplication);
                if (numeratorNode.hasFractionCoeff()) {
                    throw Error('Polynomial terms cannot have nested fractions');
                }
                this.exponent = numeratorNode.getExponentNode();
                this.symbol = numeratorNode.getSymbolNode();
                const numeratorConstantNode = numeratorNode.getCoeffNode(true);
                this.coeff = NodeCreator.operator(
                    '/', [numeratorConstantNode, denominatorNode]);
            }
            else {
                throw Error('Unsupported operatation for polynomial node: ' + node.op);
            }
        }
        else if (NodeType.isUnaryMinus(node)) {
            var arg = node.args[0] as mNode;
            if (NodeType.isParenthesis(arg)) {
                arg = arg.content;
            }
            const polyNode = new PolynomialTerm(
                arg, onlyImplicitMultiplication);
            this.exponent = polyNode.getExponentNode();
            this.symbol = polyNode.getSymbolNode();
            if (!polyNode.hasCoeff()) {
                this.coeff = NodeCreator.constant(-1);
            }
            else {
                this.coeff = negativeCoefficient(polyNode.getCoeffNode());
            }
        }
        else if (NodeType.isSymbol(node)) {
            this.symbol = node;
        }
        else {
            throw Error('Unsupported node type: ' + node.type);
        }
    }

    /* GETTER FUNCTIONS */
    getSymbolNode() {
        return this.symbol;
    }

    getSymbolName() {
        return this.symbol.name;
    }

    getCoeffNode(defaultOne = false) {
        if (!this.coeff && defaultOne) {
            return Creator.constant(1);
        }
        else {
            return this.coeff;
        }
    }

    getCoeffValue() {
        if (this.coeff) {
            return evaluate(this.coeff);
        }
        else {
            return 1; // no coefficient is like a coeff of 1
        }
    }

    getExponentNode(defaultOne = false) {
        if (!this.exponent && defaultOne) {
            return Creator.constant(1);
        }
        else {
            return this.exponent;
        }
    }

    getRootNode() {
        return Creator.polynomialTerm(
            this.symbol, this.exponent, this.coeff);
    }

    // note: there is no exponent value getter function because the exponent
    // can be any expresion and not necessarily a number.

    /* CHECKER FUNCTIONS (returns true / false for certain conditions) */

    // Returns true if the coefficient is a fraction
    hasFractionCoeff() {
        // coeffNode is either a constant or a division operation.
        return this.coeff && Type.isOperator(this.coeff);
    }

    hasCoeff() {
        return !!this.coeff;
    }


    // Returns if the node represents an expression that can be considered a term.
    // e.g. x^2, 2y, z, 3x/5 are all terms. 4, 2+x, 3*7, x-z are all not terms.
    // See the tests for some more thorough examples of exactly what counts and
    // what does not.
    static isPolynomialTerm(node: mNode, onlyImplicitMultiplication = false) {
        try {
            // will throw error if node isn't poly term
            new PolynomialTerm(node, onlyImplicitMultiplication);
            return true;
        }
        catch (err) {
            return false;
        }
    };

    // Multiplies `node`, a constant or fraction of two constant nodes, by -1
    // Returns a node
    static negativeCoefficient(node: mNode) {
        if (Type.isConstant(node)) {
            node = Creator.constant(0 - parseFloat(node.value));
        }
        else {
            const numeratorValue = 0 - parseFloat(node.args[0].value);
            node.args[0] = Creator.constant(numeratorValue);
        }
        return node;
    }
}
/*
None of this works :(
// create node constructors because we can't use the ones from mathjs :(
function OperatorNode(op: string, fn: string, args: mNode[]): mNode {
    let node: mNode = {
        isNode: true,
        type: "OperatorNode",
        isOperatorNode: true,
        op: op,
        fn: fn,
        args: args as mathjs.MathNode[] || [],
        //don't know how to implement the rest of the things
        }
    return node;
}
function Constant(value: string, valueType:string): mNode {
    let node: mNode = {
        value: value,
        valueType: valueType,
        isNode: true,
        type: "OperatorNode",
        isOperatorNode: true,
        op: op,
        fn: fn,
        args: args as mathjs.MathNode[] || [],
        //don't know how to implement the rest of the things
        }
    return node;
}
*/