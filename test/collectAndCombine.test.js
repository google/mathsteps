'use strict';

const assert = require('assert');
const math = require('mathjs');

const collectAndCombine = require('../lib/collectAndCombine');
const flatten = require('../lib/flattenOperands');
const print = require('../lib/print');

function testCollectAndCombineSubsteps(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, function () {
    const status = collectAndCombine(flatten(math.parse(exprString)));
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

function testSimpleCollectAndCombine(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    const status = collectAndCombine(flatten(math.parse(exprString)));
    assert.deepEqual(
      print(status.newNode),
      outputStr);
  });
}

describe('collectAndCombine with substeps', function () {
  const tests = [
    ['2x + 4x + y',
      ['(2x + 4x) + y',
        '6x + y']
    ],
    ['2x * x^2 * 5x',
      ['(2 * 5) * (x * x^2 * x)',
        '10 * (x * x^2 * x)',
        '10 * x^4']
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1]));
});

describe('simple collectAndCombine with no substeps', function () {
  const tests = [
    ['2x + 4x + x', '7x'],
    ['x * x^2 * x', 'x^4']
  ];
  tests.forEach(t => testSimpleCollectAndCombine(t[0], t[1]));
});
