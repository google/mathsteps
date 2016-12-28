'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const collectAndCombineSearch = require('../../../lib/simplifyExpression/collectAndCombineSearch');

function testCollectAndCombineSubsteps(exprString, outputList, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    const status = collectAndCombineSearch(flatten(math.parse(exprString)));
    const substeps = status.substeps;

    assert.deepEqual(substeps.length, outputList.length);
    substeps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });
    if (outputStr) {
      assert.deepEqual(
        print(status.newNode),
        outputStr);
    }
  });
}

function testSimpleCollectAndCombineSearch(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    const status = collectAndCombineSearch(flatten(math.parse(exprString)));
    assert.deepEqual(
      print(status.newNode),
      outputStr);
  });
}

describe('combinePolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x',
      ['x^2 * x^1 * x^1',
        'x^(2 + 1 + 1)',
        'x^4'],
    ],
    ['y * y^3',
      ['y^1 * y^3',
        'y^(1 + 3)',
        'y^4'],
    ],
    ['2x * x^2 * 5x',
      ['(2 * 5) * (x * x^2 * x)',
        '10 * (x * x^2 * x)',
        '10 * x^4'],
      '10x^4'
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1], t[2]));
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
    ['2x + 4x + y',
      ['(2x + 4x) + y',
        '6x + y'],
      '6x + y'
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1]));
});

describe('collectAndCombineSearch with no substeps', function () {
  const tests = [
    ['2x + 4x + x', '7x'],
    ['x * x^2 * x', 'x^4']
  ];
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]));
});
