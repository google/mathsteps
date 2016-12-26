'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../lib/util/flattenOperands');
const print = require('../../lib/util/print');
const reduceZeroDividedByAnything = require('../../lib/simplifyBasics/reduceZeroDividedByAnything');

function testSimplify(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(reduceZeroDividedByAnything(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('simplify basics', function () {
  const tests = [
    ['0/5', '0'],
    ['0/(x+6+7+x^2+2^y)', '0'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});
