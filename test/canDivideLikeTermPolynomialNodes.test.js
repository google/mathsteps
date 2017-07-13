const canDivideLikeTermPolynomialNodes = require('../lib/checks/canDivideLikeTermPolynomialNodes');

const TestUtil = require('./TestUtil');

function testCanBeDivided(expr, multipliable) {
  TestUtil.testBooleanFunction(canDivideLikeTermPolynomialNodes, expr, multipliable);
}

describe('can divide like term polynomials', () => {
  const tests = [
    ['x^2 / x', true],
    ['3x^2 / x ', false],
    ['y^3 / y^2', true],
    ['x^8 / x^5', true]
  ];
  tests.forEach(t => testCanBeDivided(t[0], t[1]));
});
