'use strict';
const assert = require('assert');
const math = require('mathjs');

const Negative = require('../lib/Negative');

const print = require('../lib/util/print');
const flatten = require('../lib/util/flattenOperands');

function testNegate(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, () => {
    assert.deepEqual(
      print(Negative.negate(flatten(math.parse(exprString)))),outputStr);
  });
}

describe('negate', function() {
  const tests = [
    ['1', '-1'],
    ['-1', '1'],
    ['1/2', '-1/2'],
    ['(x+2)', '-(x + 2)'],
    ['x', '-x'],
    ['x^2', '-x^2'],
    ['-y^3', 'y^3'],
    ['2/3 x', '-2/3 x'],
    ['-5/6 z', '5/6 z'],
  ];
  tests.forEach(t => testNegate(t[0], t[1]));
});
