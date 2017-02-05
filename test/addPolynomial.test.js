const canAdd = require('../lib/checks/canAddLikeTermPolynomialNodes');

const TestUtil = require('./TestUtil');

function canBeAdded(expr, addable) {
  TestUtil.testBooleanFunction(canAdd, expr, addable);
}

describe('Add like term polynomials', () => {
  const tests = [
    ['x^2 + x^2', true],
    ['x + x', true],
    ['x^3 + x', false],
  ];
  tests.forEach(t => canBeAdded(t[0], t[1]));
});
