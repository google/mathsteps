'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/util/flattenOperands');
const PolynomialTermNode = require('../lib/PolynomialTermNode');
const PolynomialTermOperations = require('../lib/PolynomialTermOperations');
const print = require('./../lib/util/print');

function testIsPolynomialTerm(exprStr, isTerm) {
  it(exprStr + ' ' + isTerm, function () {
    assert.equal(
      PolynomialTermNode.isPolynomialTerm(flatten(math.parse(exprStr))),
      isTerm);
  });
}

describe('classifies symbol terms correctly', function() {
  const tests = [
    ['x', true],
    ['x', true],
    ['x^2', true],
    ['y^55', true],
    ['y^4/4', true],
    ['5y/3', true],
    ['x^y', true],
    ['3', false],
    ['2^5', false],
    ['x*y^5', false],
    ['-12y^5/-3', true],
  ];
  tests.forEach(t => testIsPolynomialTerm(t[0], t[1]));
});

function testCanCombine(exprStr, canCombine) {
  it(exprStr + ' ' + canCombine, function () {
    const inputNode = flatten(math.parse(exprStr));
    assert.equal(
      PolynomialTermOperations.canSimplifyPolynomialTerms(inputNode),
      canCombine);
  });
}

describe('canSimplifyPolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x', true],
    // false b/c coefficient
    ['x^2 * 3x * x', false],
    ['y * y^3', true],
    ['5 * y^3', false], // just needs flattening
    ['5/7 * x', false], // just needs flattening
    ['5/7 * 9 * x', false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});


describe('canSimplifyPolynomialTerms addition', function() {
  const tests = [
    ['x + x',  true],
    ['4y^2 + 7y^2 + y^2',  true],
    ['4y^2 + 7y^2 + y^2 + y',  false],
    ['y',  false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});

function testRearrangeCoefficient(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    const newNode = PolynomialTermOperations.rearrangeCoefficient(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

describe('rearrangeCoefficient', function() {
  const tests = [
    ['2 * x^2', '2x^2'],
    ['y^3 * 5', '5y^3'],
  ];
  tests.forEach(t => testRearrangeCoefficient(t[0], t[1]));
});
