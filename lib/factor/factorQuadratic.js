const ChangeTypes = require('../ChangeTypes');
const checks = require('../checks');
const ConstantFactors = require('./ConstantFactors');
const flatten = require('../../lib/util/flattenOperands');
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
  node = flatten(node);
  if (!checks.isQuadratic(node)) {
    return Node.Status.noChange(node);
  }

  // get a, b and c
  let symbol, aValue, bValue, cValue;
  for (const term of node.args) {
    if (Node.Type.isConstant(term)) {
      cValue = term.eval();
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
  if (bValue && !cValue) {
    const aNode = Node.Creator.constant(aValue);
    const bNode = Node.Creator.constant(bValue);

    let polyTerm = Node.Creator.polynomialTerm(symbol, null, aNode);
    const paren = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, bNode]));

    if (negate) {
      polyTerm = Negative.negate(polyTerm);
    }

    const newNode = Node.Creator.operator('*', [symbol, paren], true);
    return Node.Status.nodeChanged(ChangeTypes.FACTOR_SYMBOL, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 - c, and the aValue
// and cValue are perfect squares
// e.g. 4x^2 - 4 -> (2x + 2)(2x - 2)
function factorDifferenceOfSquares(node, symbol, aValue, bValue, cValue, negate) {
  // check if difference of squares: (i) abs(a) and abs(c) are squares, (ii) b = 0,
  // (iii) c is negative
  if (bValue || !cValue) {
    return Node.Status.noChange(node);
  }

  const aRootValue = Math.sqrt(Math.abs(aValue));
  const cRootValue = Math.sqrt(Math.abs(cValue));

  // must be a difference of squares
  if (Number.isInteger(aRootValue) &&
      Number.isInteger(cRootValue) &&
      cValue < 0) {

    const aRootNode = Node.Creator.constant(aRootValue);
    const cRootNode = Node.Creator.constant(cRootValue);

    const polyTerm = Node.Creator.polynomialTerm(symbol, null, aRootNode);
    let firstParen = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, cRootNode]));
    const secondParen = Node.Creator.parenthesis(
      Node.Creator.operator('-', [polyTerm, cRootNode]));

    if (negate) {
      firstParen = Negative.negate(firstParen);
    }

    // create node in difference of squares form
    const newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
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

  const aRootValue = Math.sqrt(Math.abs(aValue));
  let cRootValue = Math.sqrt(Math.abs(cValue));

  // if the second term is negative, then the constant in the parens is
  // subtracted: e.g. x^2 - 2x + 1 -> (x - 1)^2
  if (bValue < 0) {
    cRootValue = cRootValue * -1;
  }

  // apply the perfect square test
  const perfectProduct = 2 * aRootValue * cRootValue;
  if (Number.isInteger(aRootValue) &&
      Number.isInteger(cRootValue) &&
      bValue === perfectProduct) {

    const aRootNode = Node.Creator.constant(aRootValue);
    const cRootNode = Node.Creator.constant(cRootValue);

    const polyTerm = Node.Creator.polynomialTerm(symbol, null, aRootNode);
    let paren = Node.Creator.parenthesis(
      Node.Creator.operator('+', [polyTerm, cRootNode]));
    const exponent = Node.Creator.constant(2);

    if (negate) {
      paren = Negative.negate(paren);
    }

    // create node in perfect square form
    const newNode = Node.Creator.operator('^', [paren, exponent]);
    return Node.Status.nodeChanged(
      ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
  }

  return Node.Status.noChange(node);
}

// Will factor the node if it's in the form of x^2 + bx + c (i.e. a is 1), by
// applying the sum product rule: finding factors of c that add up to b.
// e.g. x^2 + 3x + 2 -> (x + 1)(x + 2)
function factorSumProductRule(node, symbol, aValue, bValue, cValue, negate) {
  if (aValue === 1 && bValue && cValue) {
    // try sum/product rule: find a factor pair of c that adds up to b
    const factorPairs = ConstantFactors.getFactorPairs(cValue, true);
    for (const pair of factorPairs) {
      if (pair[0] + pair[1] === bValue) {
        const polyTerm = Node.Creator.polynomialTerm(symbol, null);
        let firstParen = Node.Creator.parenthesis(
          Node.Creator.operator('+', [polyTerm, Node.Creator.constant(pair[0])]));
        const secondParen = Node.Creator.parenthesis(
          Node.Creator.operator('+', [polyTerm, Node.Creator.constant(pair[1])]));

        if (negate) {
          firstParen = Negative.negate(firstParen);
        }

        // create a node in the general factored form for expression
        const newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
        return Node.Status.nodeChanged(
          ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
      }
    }
  }

  return Node.Status.noChange(node);
}


module.exports = factorQuadratic;
