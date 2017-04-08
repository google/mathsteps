import mathNode = require('./mathNode');

class Negative {
// Returns if the given node is negative. Treats a unary minus as a negative,
// as well as a negative constant value or a constant fraction that would
// evaluate to a negative number
    isNegative(node) {
        if (mathNode.Type.isUnaryMinus(node)) {
            return !Negative.isNegative(node.args[0]);
        } else if (mathNode.Type.isConstant(node)) {
            return parseFloat(node.value) < 0;
        } else if (mathNode.Type.isConstantFraction(node)) {
            const numeratorValue = parseFloat(node.args[0].value);
            const denominatorValue = parseFloat(node.args[1].value);
            if (numeratorValue < 0 || denominatorValue < 0) {
                return !(numeratorValue < 0 && denominatorValue < 0);
            }
        } else if (mathNode.PolynomialTerm.isPolynomialTerm(node)) {
            const polyNode = new mathNode.PolynomialTerm(node);
            return Negative.isNegative(polyNode.getCoeffNode(true));
        }

        return false;
    }

// Given a node, returns the negated node
// If naive is true, then we just add an extra unary minus to the expression
// otherwise, we do the actual negation
// E.g.
//    not naive: -3 -> 3, x -> -x
//    naive: -3 -> --3, x -> -x
    negate(node, naive=false) {
        if (mathNode.Type.isConstantFraction(node)) {
            node.args[0] = Negative.negate(node.args[0], naive);
            return node;
        } else if (mathNode.PolynomialTerm.isPolynomialTerm(node)) {
            return Negative.negatePolynomialTerm(node, naive);
        } else if (!naive) {
            if (mathNode.Type.isUnaryMinus(node)) {
                return node.args[0];
            } else if (mathNode.Type.isConstant(node)) {
                return mathNode.Creator.constant(0 - parseFloat(node.value));
            }
        }
        return mathNode.Creator.unaryMinus(node);
    }

// Multiplies a polynomial term by -1 and returns the new node
// If naive is true, then we just add an extra unary minus to the expression
// otherwise, we do the actual negation
// E.g.
//    not naive: -3x -> 3x, x -> -x
//    naive: -3x -> --3x, x -> -x
    negatePolynomialTerm(node, naive=false) {
        if (!mathNode.PolynomialTerm.isPolynomialTerm(node)) {
            throw Error('node is not a polynomial term');
        }
        const polyNode = new mathNode.PolynomialTerm(node);

        let newCoeff;
        if (!polyNode.hasCoeff()) {
            newCoeff = mathNode.Creator.constant(-1);
        } else {
            const oldCoeff = polyNode.getCoeffNode();
            if (oldCoeff.value === '-1') {
                newCoeff = null;
            } else if (polyNode.hasFractionCoeff()) {
                let numerator = oldCoeff.args[0];
                numerator = Negative.negate(numerator, naive);

                const denominator = oldCoeff.args[1];
                newCoeff = mathNode.Creator.operator('/', [numerator, denominator]);
            } else {
                newCoeff = Negative.negate(oldCoeff, naive);
                if (newCoeff.value === '1') {
                    newCoeff = null;
                }
            }
        }
        return mathNode.Creator.polynomialTerm(
            polyNode.getSymbolNode(),
            polyNode.getExponentNode(),
            newCoeff);
    }
}

export = Negative;
