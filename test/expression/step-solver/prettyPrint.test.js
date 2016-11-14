'use strict';

const assert = require('assert');
const math = require('../../../index');
const print = require('../../../lib/expression/step-solver/print.js');
const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');

function testPrint(exprStr, outputStr, latex=false) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(math.parse(exprStr), latex),
      outputStr);
  });
}

describe('print asciimath', function () {
  const tests = [
    ['2+3+4', '2 + 3 + 4'],
    ['2 + (4 - x) + - 4', '2 + (4 - x) - 4'],
    ['2/3 x^2', '2/3 x^2'],
    ['-2/3', '-2/3'],
  ];
  tests.forEach(t => testPrint(t[0], t[1]));
});

describe('print latex', function () {
  const tests = [
    ['2+3+4', '2 + 3 + 4'],
    ['2 + (4 - x) + - 4', '2 + \\left(4 - x\\right) - 4'],
    ['2 * 3', '2 \\cdot 3'],
    ['2/3 x^2', '\\frac{2}{3} {x}^{2}'],
  ];
  tests.forEach(t => testPrint(t[0], t[1], true));
});
