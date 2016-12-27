'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const reduceMultiplicationByZero = require('../../../lib/simplifyExpression/basics/reduceMultiplicationByZero');

function testSimplify(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(reduceMultiplicationByZero(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('reduce multiplication by 0', function () {
  const tests = [
    ['0x', '0'],
    ['2*0*z^2','0'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});
