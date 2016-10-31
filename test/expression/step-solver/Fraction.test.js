'use strict';

const assert = require('assert');
const math = require('../../../index');

const Fraction = require('../../../lib/expression/step-solver/Fraction');
const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');

describe('isIntegerFraction', function () {
  it('4/5 true', function () {
    assert.deepEqual(
      Fraction.isIntegerFraction(math.parse('4/5')),
      true);
  });
  it('4.3/5 false', function () {
    assert.deepEqual(
      Fraction.isIntegerFraction(math.parse('4.3/5')),
      false);
  });
  it('4x/5 false', function () {
    assert.deepEqual(
      Fraction.isIntegerFraction(math.parse('4x/5')),
      false);
  });
  it('5 false', function () {
    assert.deepEqual(
      Fraction.isIntegerFraction(math.parse('5')),
      false);
  });
});

function testAddConstantFractions(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      Fraction.addConstantFractions(math.parse(exprString)).node,
      flatten(math.parse(outputStr)));
  });
}

describe('addConstantFractions', function () {
  const tests = [
    ['4/5 + 3/5', '(4+3)/5'],
    ['4/10 + 3/5', '4/10 + (3*2)/(5*2)'],
    ['4/9 + 3/5', '(4*5)/(9*5) + (3*9)/(5*9)'],
  ];
  tests.forEach(t => testAddConstantFractions(t[0], t[1]));
});

function testAddConstantAndFraction(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      Fraction.addConstantAndFraction(math.parse(exprString)).node,
      flatten(math.parse(outputStr)));
  });
}

describe('addConstantAndFraction', function () {
  const tests = [
    ['7 + 1/2', '14/2 + 1/2'],
    ['5/6 + 3', '5/6 + 18/6'],
    ['1/2 + 5.8', '0.5 + 5.8'],
    ['1/3 + 5.8', '0.3333 + 5.8'],
  ];
  tests.forEach(t => testAddConstantAndFraction(t[0], t[1]));
});

function testMultiplyConstantsAndFractions(exprString, outputStr) {
  const node = flatten(math.parse(exprString));
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      flatten(Fraction.multiplyConstantsAndFractions(node).node),
      flatten(math.parse(outputStr)));
  });
}

describe('multiplyConstantsAndFractions', function () {
  const tests = [
    ['3 * 1/5 * 5/9', '(3*1*5)/(5*9)'],
    ['3/7 * 10/11', '(3*10)/(7*11)'],
  ];
  tests.forEach(t => testMultiplyConstantsAndFractions(t[0], t[1]));
});

function testSimplifyFraction(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      flatten(Fraction.simplifyFraction(flatten(math.parse(exprStr)))).node,
      flatten(math.parse(outputStr)));
  });
}

describe('simplifyFraction', function() {
  const tests = [
    ['2/4', '1/2'],
    ['9/3', '3'],
    ['1/-3', '-1/3'],
    ['-3/-2', '3/2'],
    ['-1/-1', '1'],
    ['12/27', '4/9'],
  ]
  tests.forEach(t => testSimplifyFraction(t[0], t[1]));
});

function testMultiplyByInverse(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      flatten(Fraction.multiplyByInverse(flatten(math.parse(exprStr)))).node,
      flatten(math.parse(outputStr)));
  });
}

describe('simplifyFraction', function() {
  const tests = [
    ['x/(2/3)', 'x * 3/2'],
    ['x / (y/(z+a))', 'x * (z+a)/y'],
    ['x/((2+z)/(3/y))', 'x * (3/y)/(2+z)'],
  ]
  tests.forEach(t => testMultiplyByInverse(t[0], t[1]));
});
