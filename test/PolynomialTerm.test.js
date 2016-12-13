'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const collectAndCombineLikeTerms = require('../lib/collectAndCombine');
const PolynomialTermNode = require('../lib/PolynomialTermNode');
const PolynomialTermOperations = require('../lib/PolynomialTermOperations');
const print = require('./../lib/print');

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

// TODO: move these tests to collect and combine during the file structure
// refactor
function testCombinePolynomialTermsSteps(exprStr, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprStr + ' -> ' + lastString, function () {
    const inputNode = flatten(math.parse(exprStr));
    const status = collectAndCombineLikeTerms(inputNode);
    const substeps = status.substeps;
    assert.deepEqual(substeps.length, outputList.length);
    substeps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });

    assert.deepEqual(
      print(status.newNode),
      lastString);
  });
}

function testCanCombine(exprStr, canCombine) {
  it(exprStr + ' ' + canCombine, function () {
    const inputNode = flatten(math.parse(exprStr));
    assert.equal(
      PolynomialTermOperations.canCombinePolynomialTerms(inputNode),
      canCombine);
  });
}

describe('canCombinePolynomialTerms multiplication', function() {
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

describe('combinePolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x',
      ['x^2 * x^1 * x^1',
        'x^(2 + 1 + 1)',
        'x^4']
    ],
    ['y * y^3',
      ['y^1 * y^3',
        'y^(1 + 3)',
        'y^4']
    ],
  ];
  tests.forEach(t => testCombinePolynomialTermsSteps(t[0], t[1]));
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
    ['x+x',
      ['1x + 1x',
        '(1 + 1)x',
        '2x']
    ],
    ['4y^2 + 7y^2 + y^2',
      ['4y^2 + 7y^2 + 1y^2',
        '(4 + 7 + 1)y^2',
        '12y^2']
    ],
  ];
  tests.forEach(t => testCombinePolynomialTermsSteps(t[0], t[1]));
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
    ['1.6x / 1.6', 'x'],
  ];
  tests.forEach(t => testSimplifyPolynomialFraction(t[0], t[1]));
});
