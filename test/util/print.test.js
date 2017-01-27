'use strict';
const assert = require('assert');
const print = require('../../lib/util/print');
const math = require('mathjs');

function testPrint(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, () => {
    assert.deepEqual(print(math.parse(exprStr)), outputStr);
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
