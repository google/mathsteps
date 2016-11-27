'use strict';

const assert = require('assert');
const Factor = require('../lib/Factor');

function testPrimeFactors(input, output) {
  it(input + ' -> ' + output, function () {
    assert.deepEqual(
      Factor.getPrimeFactors(input),
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
