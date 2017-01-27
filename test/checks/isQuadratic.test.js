'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../lib/util/flattenOperands');
const checks = require('../../lib/checks');

function testIsQuadratic(exprString, result) {
  it(exprString  + ' ' + result, function () {
    assert.deepEqual(
      checks.isQuadratic(flatten(math.parse(exprString))),
      result);
  });
}

describe('isQuadratic', function () {
  const tests = [
    ['2 + 2', false],
    ['x', false],
    ['x^2 - 4', true],
    ['x^2 + 2x + 1', true],
    ['x^2 - 2x + 1', true],
    ['x^2 + 3x + 2', true],
    ['x^2 - 3x + 2', true],
    ['x^2 + x - 2', true],
    ['x^2 + 4', true],
    ['x^2 + 4x + 1', true],
    ['x^2', false],
    ['x^3 + x^2 + x + 1', false],
  ];
  tests.forEach(t => testIsQuadratic(t[0], t[1]));
});
