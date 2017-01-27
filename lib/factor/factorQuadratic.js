'use strict';

const checks = require('../checks');
const ConstantFactors = require('./ConstantFactors');
const ChangeTypes = require('../ChangeTypes');
const flatten = require('../../lib/util/flattenOperands');
const Negative = require('../Negative');
const Node = require('../node');

// Given a node, will check if it's in the form of a quadratic equation
// `ax^2 + bx + c`, and
// if it is, will factor it using on of the following rules:
//    - Difference of squares e.g. x^2 - 4 -> (x+2)(x-2)
//    - Perfect square e.g. x^2 + 2x + 1 -> (x+1)^2
//    - Sum/product rule e.g. x^2 + 3x + 2 -> (x+1)(x+2)
//    - TODO: quadratic formula
function factorQuadratic(node) {
  node = flatten(node);
  if (!checks.isQuadratic(node)) {
    return Node.Status.noChange(node);
  }

  // get a, b and c
  let firstTermNode, secondTermNode, constantTermValue;
  for (const term of node.args) {
    if (Node.Type.isConstant(term)) {
      constantTermValue = term.eval();
    }
    else if (Node.PolynomialTerm.isPolynomialTerm(term)) {
      const polyTerm = new Node.PolynomialTerm(term);
      const exponent = polyTerm.getExponentNode(true);
      if (exponent.value === '2') {
        firstTermNode = polyTerm;
      }
      else if (exponent.value === '1') {
        secondTermNode = polyTerm;
      }
      else {
        return Node.Status.noChange(node);
      }
    }
    else {
      return Node.Status.noChange(node);
    }
  }

  if (!firstTermNode || !constantTermValue) {
    return Node.Status.noChange(node);
  }

  const symbol = firstTermNode.getSymbolNode();
  const firstTermCoeffValue = firstTermNode.getCoeffValue();
  const firstTermCoeffRootValue = Math.sqrt(Math.abs(firstTermCoeffValue));
  const firstTermCoeffRootNode = Node.Creator.constant(firstTermCoeffRootValue);
  let constantTermRootValue = Math.sqrt(Math.abs(constantTermValue));
  let constantTermRootNode = Node.Creator.constant(constantTermRootValue);

  // check if difference of squares: are a and c squares and there is no b
  if (!secondTermNode) {
    // must be a difference of squares
    if (constantTermValue < 0 &&
        firstTermCoeffRootValue % 1 === 0 &&
        constantTermRootValue % 1 === 0) {
      const polyTerm = Node.Creator.polynomialTerm(symbol, null, firstTermCoeffRootNode);
      const firstParen = Node.Creator.parenthesis(
        Node.Creator.operator('+', [polyTerm, constantTermRootNode]));
      const secondParen = Node.Creator.parenthesis(
        Node.Creator.operator('-', [polyTerm, constantTermRootNode]));

      // create node in difference of squares form
      const newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
      return Node.Status.nodeChanged(
        ChangeTypes.FACTOR_DIFFERENCE_OF_SQUARES, node, newNode);
    }
  }
  else {
    // check if perfect square: are a and c squares and b = 2*sqrt(a)*sqrt(c)

    // if the second term is negative, then the constant in the parens is subtracted
    // i.e. x^2 -2x + 1 -> (x-1)^2
    const secondTermCoeffValue = secondTermNode.getCoeffValue();
    if (secondTermCoeffValue < 0) {
      constantTermRootValue = constantTermRootValue * -1;
      constantTermRootNode = Negative.negate(constantTermRootNode);
    }

    const perfectProduct = 2 * firstTermCoeffRootValue * constantTermRootValue;
    if (firstTermCoeffRootValue % 1 === 0 &&
        constantTermRootValue % 1 === 0 &&
        secondTermCoeffValue === perfectProduct) {
      const polyTerm = Node.Creator.polynomialTerm(symbol, null, firstTermCoeffRootNode);
      const paren = Node.Creator.parenthesis(
        Node.Creator.operator('+', [polyTerm, constantTermRootNode]));
      const exponent = Node.Creator.constant(2);

      // create node in perfect square form
      const newNode = Node.Creator.operator('^', [paren, exponent]);
      return Node.Status.nodeChanged(
        ChangeTypes.FACTOR_PERFECT_SQUARE, node, newNode);
    }
    else if (firstTermCoeffValue === 1) {
      // try sum/product rule: find a factor pair of c that adds up to b
      const factorPairs = ConstantFactors.getFactorPairs(constantTermValue, true);
      for (const pair of factorPairs) {
        if (pair[0] + pair[1] === secondTermCoeffValue) {
          const polyTerm = Node.Creator.polynomialTerm(symbol, null, firstTermCoeffRootNode);
          const firstParen = Node.Creator.parenthesis(
            Node.Creator.operator('+', [polyTerm, Node.Creator.constant(pair[0])]));
          const secondParen = Node.Creator.parenthesis(
            Node.Creator.operator('+', [polyTerm, Node.Creator.constant(pair[1])]));

          // create a node in the general factored form for expression
          const newNode = Node.Creator.operator('*', [firstParen, secondParen], true);
          return Node.Status.nodeChanged(
            ChangeTypes.FACTOR_SUM_PRODUCT_RULE, node, newNode);
        }
      }
    }
  }

  // TODO: quadratic formula
  // a(x - (-b + sqrt(b^2 - 4ac)) / 2a)(x - (-b - sqrt(b^2 - 4ac)) / 2a)

  return Node.Status.noChange(node);
}

module.exports = factorQuadratic;
