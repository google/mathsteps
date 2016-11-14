'use strict';

const assert = require('assert');
const math = require('../../../index');

const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');
const PolynomialTermNode = require('../../../lib/expression/step-solver/PolynomialTermNode.js');
const PolynomialTermOperations = require('../../../lib/expression/step-solver/PolynomialTermOperations.js');
const print = require('./../../../lib/expression/step-solver/prettyPrint');

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

function testCombinePolynomialTerms(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    const combinedNode = PolynomialTermOperations.combinePolynomialTerms(inputNode).newNode;
    assert.equal(
      print(combinedNode),
      outputStr);
  });
};

function testCanCombine(exprStr, canCombine) {
  it(exprStr + ' ' + canCombine, function () {
    const inputNode = flatten(math.parse(exprStr));
    assert.equal(
      PolynomialTermOperations.canCombinePolynomialTerms(inputNode),
      canCombine);
  });
};

describe('canCombinePolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x', true],
    // false b/c coefficient
    ['x^2 * 3x * x', false],
    ['y * y^3', true],
    // next 3: test that it makes it implicit
    ['5 * y^3', true],
    ['5/7 * x', true],
    ['5/7*9 * x', false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});

describe('combinePolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x', 'x^(2 + 1 + 1)'],
    ['y * y^3', 'y^(1 + 3)'],
  ];
  tests.forEach(t => testCombinePolynomialTerms(t[0], t[1]));
});

describe('canCombinePolynomialTerms addition', function() {
  const tests = [
    ['x + x',  true],
    ['4y^2 + 7y^2 + y^2',  true],
    ['4y^2 + 7y^2 + y^2 + y',  false],
    ['y',  false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});

describe('combinePolynomialTerms addition', function() {
  const tests = [
    ['x+x', '(1 + 1)x'],
    ['4y^2 + 7y^2 + y^2', '(4 + 7 + 1)y^2'],
  ];
  tests.forEach(t => testCombinePolynomialTerms(t[0], t[1]));
});

function testMultiplyConstantAndPolynomialTerm(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    const newNode = PolynomialTermOperations.multiplyConstantAndPolynomialTerm(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

describe('multiplyConstantAndPolynomialTerm', function() {
  const tests = [
    ['2 * x^2', '2x^2'],
    ['y^3 * 5', '5y^3'],
  ];
  tests.forEach(t => testMultiplyConstantAndPolynomialTerm(t[0], t[1]));
});

function testSimplifyPolynomialFraction(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    assert.deepEqual(
      print(PolynomialTermOperations.simplifyPolynomialFraction(inputNode).newNode),
      outputStr);
  });
}

describe('simplifyPolynomialFraction', function() {
  const tests = [
    ['2x/4', '1/2 x'],
    ['9y/3', '3y'],
    ['y/-3', '-1/3 y'],
    ['-3y/-2', '3/2 y'],
    ['-y/-1', 'y'],
    ['12z^2/27', '4/9 z^2'],
  ];
  tests.forEach(t => testSimplifyPolynomialFraction(t[0], t[1]));
});
