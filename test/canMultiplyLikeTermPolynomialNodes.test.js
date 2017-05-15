const canMultiplyLikeTermPolynomialNodes = require('../lib/checks/canMultiplyLikeTermPolynomialNodes');

const TestUtil = require('./TestUtil');

function testCanBeMultiplied(expr, multipliable) {
  TestUtil.testBooleanFunction(canMultiplyLikeTermPolynomialNodes, expr, multipliable);
}

describe('can multiply like term polynomials', () => {
  const tests = [
    ['x^2 * x * x', true],
    ['x^2 * 3x * x', false],
    ['y * y^3', true],
    ['x^3 * x^2', true]
  ];
  tests.forEach(t => testCanBeMultiplied(t[0], t[1]));
});
