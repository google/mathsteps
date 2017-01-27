'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../lib/util/flattenOperands');
const print = require('../../lib/util/print');

const factorQuadratic = require('../../lib/factor/factorQuadratic');

function testFactorQuadratic(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(factorQuadratic(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('factorQuadratic', function () {
  const tests = [
    ['x^2 - 4', '(x + 2)(x - 2)'],
    ['x^2 + 2x + 1', '(x + 1)^2'],
    ['x^2 - 2x + 1', '(x - 1)^2'],
    ['x^2 + 3x + 2', '(x + 1)(x + 2)'],
    ['x^2 - 3x + 2', '(x - 1)(x - 2)'],
    ['x^2 + x - 2', '(x - 1)(x + 2)'],
    ['x^2 + 4', 'x^2 + 4'],
    ['x^2 + 4x + 1', 'x^2 + 4x + 1'],
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});
