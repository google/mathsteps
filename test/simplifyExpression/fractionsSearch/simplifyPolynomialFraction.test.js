'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const simplifyPolynomialFraction = require('../../../lib/simplifyExpression/fractionsSearch/simplifyPolynomialFraction');

function testSimplifyPolynomialFraction(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    assert.deepEqual(
      print(simplifyPolynomialFraction(inputNode).newNode),
      outputStr);
  });
}

describe('simplifyPolynomialFraction', function() {
  const tests = [
    ['2x/4', '1/2 x'],
    ['9y/3', '3y'],
    ['y/-3', '-1/3 y'],
    ['-3y/-2', '3/2 y'],
    ['-y/-1', 'y'],
    ['12z^2/27', '4/9 z^2'],
    ['1.6x / 1.6', 'x'],
  ];
  tests.forEach(t => testSimplifyPolynomialFraction(t[0], t[1]));
});
