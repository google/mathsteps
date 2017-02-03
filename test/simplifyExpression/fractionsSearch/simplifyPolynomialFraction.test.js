const simplifyPolynomialFraction = require('../../../lib/simplifyExpression/fractionsSearch/simplifyPolynomialFraction');

const TestUtil = require('../../TestUtil');

function testSimplifyPolynomialFraction(exprStr, outputStr) {
  TestUtil.testSimplification(simplifyPolynomialFraction, exprStr, outputStr);
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
