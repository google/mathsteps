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

describe('canSimplifyPolynomialTerms denominator in numerator', function() {
  const tests = [
    ['(x+1)/(x-2)', true],
    ['(2x)/(x+4)', true],
    ['(x)/(x+4)', true],
    ['(x)/(2x+4)', true],
    ['(x+3)/(x)', false], // Normal breakup function already solves this
    ['(2x + 3)/(2x + 2)', true],
    ['(2x+3)/(2x)', false], // Normal breakup function already solves this
    ['(2x)/(2x + 2)', true],
    ['(5x + 3)/(4)', false], // Normal breakup function already solves this
    // Not supported yet
    ['(2x)/(2 + 2x)', false],
    ['(2 + 2x)/(3x + 4)', false],
    ['(x + 3)/(2x^2 + 5)', false],
    ['(3x^2 + 3)/(2x^2 + 5)', false],
    ['(5x^2 + 3)/(2x + 5)', false],
    ['(5x^2-4x + 3)/(2x + 5)', false],
    ['(-4x + 3)/(2x^2 + 5x +7)', false],
  ];
  tests.forEach(t => testCanCombine(t[0], t[1]));
});
