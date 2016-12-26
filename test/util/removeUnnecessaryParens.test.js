'use strict';

const assert = require('assert');
const math = require('mathjs');

const removeUnnecessaryParens = require('../../lib/util/removeUnnecessaryParens');
const print = require('../../lib/util/print');

it('(x+4) + 12 -> x + 4 + 12', function () {
  assert.deepEqual(
    removeUnnecessaryParens(math.parse('(x+4) + 12')),
    math.parse('x+4+12'));
});

function testRemoveUnnecessaryParens(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(removeUnnecessaryParens(math.parse(exprStr))),
      outputStr);
  });
}

describe('removeUnnecessaryParens', function () {
  const tests = [
    ['(x+4) + 12', 'x + 4 + 12'],
    ['-(x+4x) + 12', '-(x + 4x) + 12'],
    ['x + (12)', 'x + 12'],
    ['x + (y)', 'x + y'],
    ['x + -(y)', 'x - y'],
    ['((3 - 5)) * x', '(3 - 5) * x'],
    ['((3 - 5)) * x', '(3 - 5) * x'],
    ['(((-5)))', '-5'],
    ['((4+5)) + ((2^3))', '(4 + 5) + 2^3'],
    ['(2x^6 + -50 x^2) - (x^4)', '2x^6 - 50x^2 - x^4'],
    ['(x+4) - (12 + x)', 'x + 4 - (12 + x)'],
  ];
  tests.forEach(t => testRemoveUnnecessaryParens(t[0], t[1]));
});
