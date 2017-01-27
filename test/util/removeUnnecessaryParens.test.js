'use strict';
const removeUnnecessaryParens = require('../../lib/util/removeUnnecessaryParens');
const assert = require('assert');
const print = require('../../lib/util/print');
const math = require('mathjs');

function testRemoveUnnecessaryParens(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr,  () => {
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
