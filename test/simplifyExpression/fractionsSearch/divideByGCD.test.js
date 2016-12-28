'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const divideByGCD = require('../../../lib/simplifyExpression/fractionsSearch/divideByGCD');

function testdivideByGCD(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(divideByGCD(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}

describe('simplifyFraction', function() {
  const tests = [
    ['2/4', '1/2'],
    ['9/3', '3'],
    ['12/27', '4/9'],
    ['1/-3', '-1/3'],
    ['-3/-2', '3/2'],
    ['-1/-1', '1'],
  ];
  tests.forEach(t => testdivideByGCD(t[0], t[1]));
});
