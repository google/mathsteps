'use strict';

const assert = require('assert');
const math = require('mathjs');

const ConstantFraction = require('../lib/ConstantFraction');
const Fraction = require('../lib/Fraction');
const flatten = require('../lib/flattenOperands');
const print = require('../lib/print');

function testAddConstantFractions(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, function () {
    const status = ConstantFraction.addConstantFractions(math.parse(exprString));
    const subSteps = status.subSteps;
    subSteps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });
    assert.deepEqual(
      print(status.newNode),
      lastString);
  });
}

describe('addConstantFractions', function () {
  const tests = [
    ['4/5 + 3/5',
      ['(4 + 3) / 5',
        '7/5']
    ],
    ['4/10 + 3/5',
      ['4/10 + (3 * 2) / (5 * 2)',
        '4/10 + (3 * 2) / 10',
        '4/10 + 6/10',
        '(4 + 6) / 10',
        '10/10']
    ],
    ['4/9 + 3/5',
      ['(4 * 5) / (9 * 5) + (3 * 9) / (5 * 9)',
        '(4 * 5) / 45 + (3 * 9) / 45',
        '20/45 + 27/45',
        '(20 + 27) / 45',
        '47/45']
    ],
  ];
  tests.forEach(t => testAddConstantFractions(t[0], t[1]));
});

function testAddConstantAndFraction(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, function () {
    const status = ConstantFraction.addConstantAndFraction(math.parse(exprString));
    const subSteps = status.subSteps;
    subSteps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });
    assert.deepEqual(
      print(status.newNode),
      lastString);
  });
}

describe('addConstantAndFraction', function () {
  const tests = [
    ['7 + 1/2',
      ['14/2 + 1/2',
       '(14 + 1) / 2',
       '15/2']
    ],
    ['5/6 + 3',
      ['5/6 + 18/6',
        '(5 + 18) / 6',
        '23/6'],
    ],
    ['1/2 + 5.8',
      ['0.5 + 5.8',
        '6.3'],
    ],
    ['1/3 + 5.8',
      ['0.3333 + 5.8',
        '6.1333']
    ],
  ];
  tests.forEach(t => testAddConstantAndFraction(t[0], t[1]));
});

function testMultiplyFractions(exprString, outputStr) {
  const node = flatten(math.parse(exprString));
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(Fraction.multiplyFractionsDFS(node).newNode),
      outputStr);
  });
}

describe('multiplyFractions', function () {
  const tests = [
    ['3 * 1/5 * 5/9', '(3 * 1 * 5) / (5 * 9)'],
    ['3/7 * 10/11', '(3 * 10) / (7 * 11)'],
    ['2 * 5/x', '(2 * 5) / x']
  ];
  tests.forEach(t => testMultiplyFractions(t[0], t[1]));
});

function testSimplifyFraction(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(Fraction.simplifyFraction(flatten(math.parse(exprStr))).newNode),
      outputStr);
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
    ['-12x / -27', '12x / 27'],
    ['x / -y', '-x / y'],
  ];
  tests.forEach(t => testSimplifyFraction(t[0], t[1]));
});

function testMultiplyByInverse(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(Fraction.multiplyByInverse(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}

describe('multiplyByInverse', function() {
  const tests = [
    ['x/(2/3)', 'x * 3/2'],
    ['x / (y/(z+a))', 'x * (z + a) / y'],
    ['x/((2+z)/(3/y))', 'x * (3 / y) / (2 + z)'],
  ];
  tests.forEach(t => testMultiplyByInverse(t[0], t[1]));
});

function testBreakUpNumerator(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(Fraction.breakUpNumeratorDFS(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}

describe('breakUpNumerator', function() {
  const tests = [
    ['(x+3+y)/3', '(x / 3 + 3/3 + y / 3)'],
    ['(2+x)/4', '(2/4 + x / 4)'],
    ['2(x+3)/3', '2 * (x / 3 + 3/3)'],
  ];
  tests.forEach(t => testBreakUpNumerator(t[0], t[1]));
});
