'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const print = require('./../lib/print');
const evaluateFunctions = require('../lib/evaluateFunctions');

function testEvaluateFunctions(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(evaluateFunctions(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('nthRoot', function () {
  const tests = [
    ['nthRoot(4)', '2'],
    ['nthRoot(8, 3)', '2'],
    ['nthRoot(12)', '2 * nthRoot(3, 2)'],
    ['nthRoot(36)', '6'],
    ['nthRoot(72)', '2 * 3 * nthRoot(2, 2)'],
    ['nthRoot(x^2)', 'x'],
    ['nthRoot(x ^ 3)', 'nthRoot(x ^ 3)'],
    ['nthRoot(x^3, 3)', 'x'],
    ['nthRoot(-2)', 'nthRoot(-2)'],
    ['nthRoot(2 ^ x, x)', '2'],
    ['nthRoot(x ^ (1/2), 1/2)', 'x'],
  ];
  tests.forEach(t => testEvaluateFunctions(t[0], t[1]));
});
describe('abs', function () {
  const tests = [
    ['abs(4)', '4'],
    ['abs(-5)', '5'],
  ];
  tests.forEach(t => testEvaluateFunctions(t[0], t[1]));
});
