import * as nodeHelper from "../nodeHelper";
    //returns all prime factors of a number
    export function getPrimeFactors(number: number): number[] {
        let factors = [];
        if (number < 0) {
            factors = [-1];
            factors = factors.concat(getPrimeFactors(-1 * number));
            return factors;
        }

        const root = Math.sqrt(number);
        let candidate = 2;
        if (number % 2) {
            candidate = 3; // assign first odd
            while (number % candidate && candidate <= root) {
                candidate = candidate + 2;
            }
        }

        // if no factor found then the number is prime
        if (candidate > root) {
            factors.push(number);
        }
        // if we find a factor, make a recursive call on the quotient of the number and
        // our newly found prime factor in order to find more factors
        else {
            factors.push(candidate);
            factors = factors.concat(getPrimeFactors(number / candidate));
        }

        return factors;
    }
    // Given a number, will return all the factor pairs for that number as a list
    // of 2-item lists
    export function getFactorPairs(number: number): number[][] {
        const factors = [];

        const bound = Math.floor(Math.sqrt(Math.abs(number)));
        for (var divisor = -bound; divisor <= bound; divisor++) {
            if (divisor === 0) {
                continue;
            }
            if (number % divisor === 0) {
                const quotient = number / divisor;
                factors.push([divisor, quotient]);
            }
        }

        return factors;
    }
    // functions for factoring quadratic equations
    const FACTOR_FUNCTIONS = [
  // factor just the symbol e.g. x^2 + 2x -> x(x + 2)
  factorSymbol,
  // factor difference of squares e.g. x^2 - 4
  factorDifferenceOfSquares,
  // factor perfect square e.g. x^2 + 2x + 1
  factorPerfectSquare,
  // factor sum product rule e.g. x^2 + 3x + 2
  factorSumProductRule
];
    export function factorQuadratic(node: mNode) {
        node = flatten(node);
        if (!checks.isQuadratic(node)) {
            return nodeHelper.Status.noChange(node);
        }
        // get a, b and c
        let symbol, aValue = 0, bValue = 0, cValue = 0;
        for (const term of node.args) {
            if (nodeHelper.Type.isConstant(term)) {
                cValue = evaluate(term);
            }
            else if (nodeHelper.PolynomialTerm.isPolynomialTerm(term)) {
                const polyTerm = new nodeHelper.PolynomialTerm(term);
                const exponent = polyTerm.getExponentNode(true);
                if (exponent.value === '2') {
                    symbol = polyTerm.getSymbolNode();
                    aValue = polyTerm.getCoeffValue();
                }
                else if (exponent.value === '1') {
                    bValue = polyTerm.getCoeffValue();
                }
                else {
                    return nodeHelper.Status.noChange(node);
                }
            }
            else {
                return nodeHelper.Status.noChange(node);
            }
        }

        if (!symbol || !aValue) {
            return nodeHelper.Status.noChange(node);
        }

        let negate = false;
        if (aValue < 0) {
            negate = true;
            aValue = -aValue;
            bValue = -bValue;
            cValue = -cValue;
        }

        for (let i = 0; i < FACTOR_FUNCTIONS.length; i++) {
            const nodeStatus = FACTOR_FUNCTIONS[i](node, symbol, aValue, bValue, cValue, negate);
            if (nodeStatus.hasChanged()) {
                return nodeStatus;
            }
        }

        return nodeHelper.Status.noChange(node);
    }
    // Will factor the node if it's in the form of ax^2 + bx
    function factorSymbol(node: mNode, symbol, aValue: number, bValue: number, cValue: number, negate: boolean) {
        if (!bValue || cValue) {
            return nodeHelper.Status.noChange(node);
        }

        const gcd = math.gcd(aValue, bValue);
        const gcdNode = nodeHelper.Creator.constant(gcd);
        const aNode = nodeHelper.Creator.constant(aValue / gcd);
        const bNode = nodeHelper.Creator.constant(bValue / gcd);

        const factoredNode = nodeHelper.Creator.polynomialTerm(symbol, null, gcdNode);
        const polyTerm = nodeHelper.Creator.polynomialTerm(symbol, null, aNode);
        const paren = nodeHelper.Creator.parenthesis(
            nodeHelper.Creator.operator('+', [polyTerm, bNode]));

        let newNode = nodeHelper.Creator.operator('*', [factoredNode, paren], true);
        if (negate) {
            newNode = Negative.negate(newNode);
        }

        return nodeHelper.Status.nodeChanged(ChangeTypes.FACTOR_SYMBOL, node, newNode);
    }

    // Will factor the node if it's in the form of ax^2 - c, and the aValue
    // and cValue are perfect squares
    // e.g. 4x^2 - 4 -> (2x + 2)(2x - 2)
    function factorDifferenceOfSquares(node: mNode, symbol, aValue: number, bValue: number, cValue: number, negate: boolean) {
        // check if difference of squares: (i) abs(a) and abs(c) are squares, (ii) b = 0,
        // (iii) c is negative
        if (bValue || !cValue) {
            return nodeHelper.Status.noChange(node);
        }

        const aRootValue = Math.sqrt(Math.abs(aValue));
        const cRootValue = Math.sqrt(Math.abs(cValue));

        // must be a difference of squares
        if (isInteger(aRootValue) &&
            isInteger(cRootValue) &&
            cValue < 0) {

            const aRootNode = nodeHelper.Creator.constant(aRootValue);
            const cRootNode = nodeHelper.Creator.constant(cRootValue);

            const polyTerm = nodeHelper.Creator.polynomialTerm(symbol, null, aRootNode);
            const firstParen = nodeHelper.Creator.parenthesis(
                nodeHelper.Creator.operator('+', [polyTerm, cRootNode]));
            const secondParen = nodeHelper.Creator.parenthesis(
                nodeHelper.Creator.operator('-', [polyTerm, cRootNode]));

            // create node in difference of squares form
            let newNode = nodeHelper.Creator.operator('*', [firstParen, secondParen], true);
            if (negate) {
                newNode = Negative.negate(newNode);
            }

            return nodeHelper.Status.nodeChanged(
                ChangeTypes.FACTOR_DIFFERENCE_OF_SQUARES, node, newNode);
        }

        return nodeHelper.Status.noChange(node);
    }

    // Will factor the node if it's in the form of ax^2 + bx + c, where a and c
    // are perfect squares and b = 2*sqrt(a)*sqrt(c)
    // e.g. x^2 + 2x + 1 -> (x + 1)^2
    function factorPerfectSquare(node: mNode, symbol, aValue: number, bValue: number, cValue: number, negate: boolean) {
        // check if perfect square: (i) a and c squares, (ii) b = 2*sqrt(a)*sqrt(c)
        if (!bValue || !cValue) {
            return nodeHelper.Status.noChange(node);
        }

        const aRootValue = Math.sqrt(Math.abs(aValue));
        let cRootValue = Math.sqrt(Math.abs(cValue));

        // if the second term is negative, then the constant in the parens is
        // subtracted: e.g. x^2 - 2x + 1 -> (x - 1)^2
        if (bValue < 0) {
            cRootValue = cRootValue * -1;
        }

        // apply the perfect square test
        const perfectProduct = 2 * aRootValue * cRootValue;
        if (isInteger(aRootValue) &&
            isInteger(cRootValue) &&
            bValue === perfectProduct) {

            const aRootNode = nodeHelper.Creator.constant(aRootValue);
            const cRootNode = nodeHelper.Creator.constant(cRootValue);

            const polyTerm = nodeHelper.Creator.polynomialTerm(symbol, null, aRootNode);
            const paren = nodeHelper.Creator.parenthesis(
                nodeHelper.Creator.operator('+', [polyTerm, cRootNode]));
            const exponent = nodeHelper.Creator.constant(2);

            // create node in perfect square form
            let newNode = nodeHelper.Creator.operator('^', [paren, exponent]);
            if (negate) {
                newNode = Negative.negate(newNode);
            }

            return nodeHelper.Status.nodeChanged(
                ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
        }

        return nodeHelper.Status.noChange(node);
    }

    // Will factor the node if it's in the form of x^2 + bx + c (i.e. a is 1), by
    // applying the sum product rule: finding factors of c that add up to b.
    // e.g. x^2 + 3x + 2 -> (x + 1)(x + 2)
    function factorSumProductRule(node: mNode, symbol, aValue: number, bValue: number, cValue: number, negate: boolean) {
        if (aValue === 1 && bValue && cValue) {
            // try sum/product rule: find a factor pair of c that adds up to b
            const factorPairs = getFactorPairs(cValue);
            for (const pair of factorPairs) {
                if (pair[0] + pair[1] === bValue) {
                    const firstParen = nodeHelper.Creator.parenthesis(
                        nodeHelper.Creator.operator('+', [symbol, nodeHelper.Creator.constant(pair[0])]));
                    const secondParen = nodeHelper.Creator.parenthesis(
                        nodeHelper.Creator.operator('+', [symbol, nodeHelper.Creator.constant(pair[1])]));

                    // create a node in the general factored form for expression
                    let newNode = nodeHelper.Creator.operator('*', [firstParen, secondParen], true);
                    if (negate) {
                        newNode = Negative.negate(newNode);
                    }

                    return nodeHelper.Status.nodeChanged(
                        ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
                }
            }
        }

        return nodeHelper.Status.noChange(node);
    }
    function isInteger(a: number)
    {
        return a % 1 === 0;
    }
