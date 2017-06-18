const canAddLikeTermPolynomialNodes = require('../lib/checks/canAddLikeTermPolynomialNodes');

const TestUtil = require('./TestUtil');

function testCanBeAdded(expr, addable) {
  TestUtil.testBooleanFunction(canAddLikeTermPolynomialNodes, expr, addable);
}

describe.skip('can add like term polynomials', () => {
  const tests = [
    ['x^2 + x^2', true],
    ['x + x', true],
    ['x^3 + x', false],
  ];
  tests.forEach(t => testCanBeAdded(t[0], t[1]));
});
