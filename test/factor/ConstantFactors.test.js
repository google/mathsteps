'use strict';

const assert = require('assert');

const ConstantFactors = require('../../lib/factor/ConstantFactors');

function testPrimeFactors(input, output) {
  it(input + ' -> ' + output, function () {
    assert.deepEqual(
      ConstantFactors.getPrimeFactors(input),
      output);
  });
}

describe('prime factors', function() {
  const tests = [
    [1, [1]],
    [-1, [-1, 1]],
    [-2, [-1, 2]],
    [5, [5]],
    [12, [2, 2, 3]],
    [15, [3, 5]],
    [36, [2, 2, 3, 3]],
    [49, [7, 7]],
    [1260, [2, 2, 3, 3, 5, 7]],
    [13195, [5, 7, 13, 29]],
    [1234567891, [1234567891]]
  ];
  tests.forEach(t => testPrimeFactors(t[0], t[1]));
});

function testFactorPairs(input, output) {
  it(input + ' -> ' + output, function () {
    assert.deepEqual(
      ConstantFactors.getFactorPairs(input),
      output);
  });
}

describe('factor pairs', function() {
  const tests = [
    [1, [[1, 1]]],
    [5, [[1, 5]]],
    [12, [[1, 12], [2, 6], [3, 4]]],
    [15, [[1, 15], [3, 5]]],
    [36, [[1, 36], [2, 18], [3, 12], [4, 9], [6, 6,]]],
    [49, [[1, 49], [7, 7]]],
    [1260, [[1, 1260], [2, 630], [3, 420], [4, 315], [5, 252], [6, 210], [7, 180], [9, 140], [10, 126], [12, 105], [14, 90], [15, 84], [18, 70], [20, 63], [21, 60], [28, 45], [30, 42], [35, 36]]],
    [13195, [[1, 13195], [5, 2639], [7, 1885], [13, 1015], [29, 455], [35, 377], [65, 203], [91, 145]]],
    [1234567891, [[1, 1234567891]]]
  ];
  tests.forEach(t => testFactorPairs(t[0], t[1]));
});
