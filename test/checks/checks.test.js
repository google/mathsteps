const checks = require('../../lib/checks');

const TestUtil = require('../TestUtil');

function testCanCombine(exprStr, canCombine) {
  TestUtil.testBooleanFunction(checks.canSimplifyPolynomialTerms, exprStr, canCombine);
}

describe('canSimplifyPolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x', true],
    // false b/c coefficient
    ['x^2 * 3x * x', false],
    ['y * y^3', true],
    ['5 * y^3', false], // just needs flattening
    ['5/7 * x', false], // just needs flattening
    ['5/7 * 9 * x', false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});


describe('canSimplifyPolynomialTerms addition', function() {
  const tests = [
    ['x + x',  true],
    ['4y^2 + 7y^2 + y^2',  true],
    ['4y^2 + 7y^2 + y^2 + y',  false],
    ['y',  false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});
