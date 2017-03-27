const math = require('mathjs');

const ConstantFactors = require('./ConstantFactors');

const ChangeTypes = require('../ChangeTypes');
const evaluate = require('../util/evaluate');
const Negative = require('../Negative');
const Node = require('../node');

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

// Given a node, will check if it's in the form of a quadratic equation
// `ax^2 + bx + c`, and
// if it is, will factor it using one of the following rules:
//    - Factor out the symbol e.g. x^2 + 2x -> x(x + 2)
//    - Difference of squares e.g. x^2 - 4 -> (x+2)(x-2)
//    - Perfect square e.g. x^2 + 2x + 1 -> (x+1)^2
//    - Sum/product rule e.g. x^2 + 3x + 2 -> (x+1)(x+2)
//    - TODO: quadratic formula
//        requires us simplify the following only within the parens:
//        a(x - (-b + sqrt(b^2 - 4ac)) / 2a)(x - (-b - sqrt(b^2 - 4ac)) / 2a)
function factorQuadratic(node) {
  // get a, b and c
  let symbol, aValue = 0, bValue = 0, cValue = 0;
  for (const term of node.args) {
    if (Node.Type.isConstant(term)) {
      cValue = evaluate(term);
    }
    else if (Node.PolynomialTerm.isPolynomialTerm(term)) {
      const polyTerm = new Node.PolynomialTerm(term);
      const exponent = polyTerm.getExponentNode(true);
      if (exponent.value === '2') {
        symbol = polyTerm.getSymbolNode();
        aValue = polyTerm.getCoeffValue();
      }
      else if (exponent.value === '1') {
        bValue = polyTerm.getCoeffValue();
      }
      else {
        return Node.Status.noChange(node);
      }
    }
    else {
      return Node.Status.noChange(node);
    }
  }

  if (!symbol || !aValue) {
    return Node.Status.noChange(node);
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

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx
function factorSymbol(node, symbol, aValue, bValue, cValue, negate) {
  if (!bValue || cValue) {
    return Node.Status.noChange(node);
  }

  const gcd = math.gcd(aValue, bValue);
  const gcdNode = Node.Creator.constant(gcd);
  const aNode = Node.Creator.constant(aValue/gcd);
  const bNode = Node.Creator.constant(bValue/gcd);

  const factoredNode = Node.Creator.polynomialTerm(symbol, null, gcdNode);
  const polyTerm = Node.Creator.polynomialTerm(symbol, null, aNode);
  const paren = Node.Creator.parenthesis(
    Node.Creator.operator('+', [polyTerm, bNode]));

  let newNode = Node.Creator.operator('*', [factoredNode, paren], true);
  if (negate) {
    newNode = Negative.negate(newNode);
  }

  return Node.Status.nodeChanged(ChangeTypes.FACTOR_SYMBOL, node, newNode);
}

// Will factor the node if it's in the form of ax^2 - c, and the aValue
// and cValue are perfect squares
// e.g. 4x^2 - 4 -> (2x + 2)(2x - 2)
function factorDifferenceOfSquares(node, symbol, aValue, bValue, cValue, negate) {
  // check if difference of squares:
  //    (i) abs(a) and abs(c) are squares,
  //    (ii) b = 0,
  //    (iii) c is negative
  if (bValue || !cValue) {
    return Node.Status.noChange(node);
  }

  const gcd = math.gcd(aValue, cValue);
  const aRootValue = Math.sqrt(Math.abs(aValue/gcd));
  const cRootValue = Math.sqrt(Math.abs(cValue/gcd));

  // must be a difference of squares
  if (Number.isInteger(aRootValue) &&
      Number.isInteger(cRootValue) &&
      cValue < 0) {

    const aRootNode = Node.Creator.constant(aRootValue);
    const cRootNode = Node.Creator.constant(cRootValue);

    const polyTerm = Node.Creator.polynomialTerm(symbol, null, aRootNode);
    const firstParen = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, cRootNode]));
    const secondParen = Node.Creator.parenthesis(
      Node.Creator.operator('-', [polyTerm, cRootNode]));

    // create node in difference of squares form
    let newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
    if (gcd !== 1) {
      const gcdNode = Node.Creator.constant(gcd);
      newNode = Node.Creator.operator('*', [gcdNode, newNode], true);
    }
    if (negate) {
      newNode = Negative.negate(newNode);
    }


    return Node.Status.nodeChanged(
      ChangeTypes.FACTOR_DIFFERENCE_OF_SQUARES, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx + c, where a and c
// are perfect squares and b = 2*sqrt(a)*sqrt(c)
// e.g. x^2 + 2x + 1 -> (x + 1)^2
function factorPerfectSquare(node, symbol, aValue, bValue, cValue, negate) {
  // check if perfect square: (i) a and c squares, (ii) b = 2*sqrt(a)*sqrt(c)
  if (!bValue || !cValue) {
    return Node.Status.noChange(node);
  }

  const gcd = math.gcd(aValue, bValue, cValue);
  const aRootValue = Math.sqrt(Math.abs(aValue/gcd));
  let cRootValue = Math.sqrt(Math.abs(cValue/gcd));

  // if the second term is negative, then the constant in the parens is
  // subtracted: e.g. x^2 - 2x + 1 -> (x - 1)^2
  if (bValue < 0) {
    cRootValue = cRootValue * -1;
  }

  // apply the perfect square test
  const perfectProduct = 2 * aRootValue * cRootValue;
  if (Number.isInteger(aRootValue) &&
      Number.isInteger(cRootValue) &&
      (bValue/gcd) === perfectProduct) {
    const aRootNode = Node.Creator.constant(aRootValue);
    const cRootNode = Node.Creator.constant(cRootValue);

    const polyTerm = Node.Creator.polynomialTerm(symbol, null, aRootNode);
    const paren = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, cRootNode]));
    const exponent = Node.Creator.constant(2);

    // create node in perfect square form
    let newNode = Node.Creator.operator('^', [paren, exponent]);
    if (gcd !== 1) {
      const gcdNode = Node.Creator.constant(gcd);
      newNode = Node.Creator.operator('*', [gcdNode, newNode], true);
    }
    if (negate) {
      newNode = Negative.negate(newNode);
    }

    return Node.Status.nodeChanged(
      ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of x^2 + bx + c, by
// applying the sum product rule: finding factors of a*c that add up to b.
// e.g. x^2 + 3x + 2 -> (x + 1)(x + 2) or
// or   2x^2 + 5x + 3 -> (2x - 1)(x + 3)
function factorSumProductRule(node, symbol, aValue, bValue, cValue, negate) {
  if (bValue && cValue) {
    const gcd = math.gcd(aValue, bValue, cValue);
    aValue = aValue/gcd;
    bValue = bValue/gcd;
    cValue = cValue/gcd;

    const product = aValue * cValue;

    // try sum/product rule: find a factor pair of a*c that adds up to b
    const factorPairs = ConstantFactors.getFactorPairs(product, true);
    for (const pair of factorPairs) {
      if (pair[0] + pair[1] === bValue) {
        // bValue is split into pair[0] + pair[1]
        // group the terms
        const firstGroup = [aValue, pair[0]];
        const secondGroup = [cValue, pair[1]];
        const firstGroupGcd = math.gcd(...firstGroup);
        const secondGroupGcd = math.gcd(...secondGroup);

        // factor the first group: e.g. 2x^2 + 4x -> 2x * (x + 1)
        const firstCoeffValue = Node.Creator.constant(firstGroupGcd);
        const firstCoeff = Node.Creator.polynomialTerm(
          symbol, null, firstCoeffValue);

        const firstTermInGroupCoeff = Node.Creator.constant(aValue/firstGroupGcd);
        const firstTermInGroup = Node.Creator.polynomialTerm(
          symbol, null, firstTermInGroupCoeff);
        const secondTermInGroupValue = pair[0]/firstGroupGcd;
        const secondTermInGroup = Node.Creator.constant(secondTermInGroupValue);

        // factor the second group: e.g. 3x + 3 -> 3(x + 1)
        // Since (x + 1) is the same after factoring both groups, we only find it once
        let secondCoeffValue = secondGroupGcd;
        if (pair[1] < 0) {
          secondCoeffValue = secondCoeffValue * -1;
        }
        const secondCoeff = Node.Creator.constant(secondCoeffValue);

        // factor by grouping
        const firstParen = Node.Creator.parenthesis(
          Node.Creator.operator('+', [firstTermInGroup, secondTermInGroup]));
        const secondParen = Node.Creator.parenthesis(
          Node.Creator.operator('+', [firstCoeff, secondCoeff]));


        // create a node in the general factored form for expression
        let newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
        if (gcd !== 1) {
          const gcdNode = Node.Creator.constant(gcd);
          newNode = Node.Creator.operator('*', [gcdNode, newNode], true);
        }
        if (negate) {
          newNode = Negative.negate(newNode);
        }

        return Node.Status.nodeChanged(
          ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
      }
    }
  }

  return Node.Status.noChange(node);
}

module.exports = factorQuadratic;
