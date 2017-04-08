import math = require('mathjs');
import ConstantFactors = require('./ConstantFactors');
import ChangeTypes = require('../ChangeTypes');
import checks = require('../checks');
import evaluate = require('../util/evaluate');
import flatten = require('../util/flattenOperands');
import Negative = require('../Negative');
import mathNode = require('../mathNode');
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
    return mathNode.Status.noChange(node);
  }

  // get a, b and c
  let symbol, aValue = 0, bValue = 0, cValue = 0;
  for (const term of node.args) {
      if (mathNode.Type.isConstant(term)) {
      cValue = evaluate(term);
    }
      else if (mathNode.PolynomialTerm.isPolynomialTerm(term)) {
          const polyTerm = new mathNode.PolynomialTerm(term);
      const exponent = polyTerm.getExponentNode(true);
      if (exponent.value === '2') {
        symbol = polyTerm.getSymbolNode();
        aValue = polyTerm.getCoeffValue();
      }
      else if (exponent.value === '1') {
        bValue = polyTerm.getCoeffValue();
      }
      else {
          return mathNode.Status.noChange(node);
      }
    }
    else {
          return mathNode.Status.noChange(node);
    }
  }

  if (!symbol || !aValue) {
      return mathNode.Status.noChange(node);
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

  return mathNode.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx
function factorSymbol(node, symbol, aValue, bValue, cValue, negate) {
  if (!bValue || cValue) {
      return mathNode.Status.noChange(node);
  }

  const gcd = math.gcd(aValue, bValue);
  const gcdNode = mathNode.Creator.constant(gcd);
  const aNode = mathNode.Creator.constant(aValue/gcd);
  const bNode = mathNode.Creator.constant(bValue/gcd);

  const factoredNode = mathNode.Creator.polynomialTerm(symbol, null, gcdNode);
  const polyTerm = mathNode.Creator.polynomialTerm(symbol, null, aNode);
  const paren = mathNode.Creator.parenthesis(
      mathNode.Creator.operator('+', [polyTerm, bNode]));

  let newNode = mathNode.Creator.operator('*', [factoredNode, paren], true);
  if (negate) {
    newNode = Negative.negate(newNode);
  }

  return mathNode.Status.nodeChanged(ChangeTypes.FACTOR_SYMBOL, node, newNode);
}

// Will factor the node if it's in the form of ax^2 - c, and the aValue
// and cValue are perfect squares
// e.g. 4x^2 - 4 -> (2x + 2)(2x - 2)
function factorDifferenceOfSquares(node, symbol, aValue, bValue?, cValue?, negate?) {
  // check if difference of squares: (i) abs(a) and abs(c) are squares, (ii) b = 0,
  // (iii) c is negative
  if (bValue || !cValue) {
      return mathNode.Status.noChange(node);
  }

  const aRootValue = Math.sqrt(Math.abs(aValue));
  const cRootValue = Math.sqrt(Math.abs(cValue));

  // must be a difference of squares
  if ((aRootValue%1 === 0) &&
      (cRootValue % 1 === 0) &&
      cValue < 0) {

      const aRootNode = mathNode.Creator.constant(aRootValue);
      const cRootNode = mathNode.Creator.constant(cRootValue);

    const polyTerm = mathNode.Creator.polynomialTerm(symbol, null, aRootNode);
    const firstParen = mathNode.Creator.parenthesis(
      mathNode.Creator.operator('+', [polyTerm, cRootNode]));
    const secondParen = mathNode.Creator.parenthesis(
      mathNode.Creator.operator('-', [polyTerm, cRootNode]));

    // create node in difference of squares form
    let newNode = mathNode.Creator.operator('*', [firstParen, secondParen], true);
    if (negate) {
      newNode = Negative.negate(newNode);
    }

    return mathNode.Status.nodeChanged(
      ChangeTypes.FACTOR_DIFFERENCE_OF_SQUARES, node, newNode);
  }

  return mathNode.Status.noChange(node);
}

// Will factor the node if it's in the form of ax^2 + bx + c, where a and c
// are perfect squares and b = 2*sqrt(a)*sqrt(c)
// e.g. x^2 + 2x + 1 -> (x + 1)^2
function factorPerfectSquare(node, symbol, aValue, bValue, cValue, negate) {
  // check if perfect square: (i) a and c squares, (ii) b = 2*sqrt(a)*sqrt(c)
  if (!bValue || !cValue) {
    return mathNode.Status.noChange(node);
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
  if ((aRootValue%1 === 0) &&
      (cRootValue %1 === 0) &&
      bValue === perfectProduct) {

      const aRootNode = mathNode.Creator.constant(aRootValue);
      const cRootNode = mathNode.Creator.constant(cRootValue);

    const polyTerm = mathNode.Creator.polynomialTerm(symbol, null, aRootNode);
    const paren = mathNode.Creator.parenthesis(
        mathNode.Creator.operator('+', [polyTerm, cRootNode]));
    const exponent = mathNode.Creator.constant(2);

    // create node in perfect square form
    let newNode = mathNode.Creator.operator('^', [paren, exponent]);
    if (negate) {
      newNode = Negative.negate(newNode);
    }

    return mathNode.Status.nodeChanged(
      ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
  }

  return mathNode.Status.noChange(node);
}

// Will factor the node if it's in the form of x^2 + bx + c (i.e. a is 1), by
// applying the sum product rule: finding factors of c that add up to b.
// e.g. x^2 + 3x + 2 -> (x + 1)(x + 2)
function factorSumProductRule(node, symbol, aValue, bValue, cValue, negate) {
  if (aValue === 1 && bValue && cValue) {
    // try sum/product rule: find a factor pair of c that adds up to b
    const factorPairs = ConstantFactors.getFactorPairs(cValue);
    for (const pair of factorPairs) {
      if (pair[0] + pair[1] === bValue) {
          const firstParen = mathNode.Creator.parenthesis(
            mathNode.Creator.operator('+', [symbol, mathNode.Creator.constant(pair[0])]));
        const secondParen = mathNode.Creator.parenthesis(
            mathNode.Creator.operator('+', [symbol, mathNode.Creator.constant(pair[1])]));

        // create a node in the general factored form for expression
        let newNode = mathNode.Creator.operator('*', [firstParen, secondParen], true);
        if (negate) {
          newNode = Negative.negate(newNode);
        }

        return mathNode.Status.nodeChanged(
          ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
      }
    }
  }

  return mathNode.Status.noChange(node);
}

export = factorQuadratic;
