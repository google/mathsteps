const canMultiplyLikeTermConstantNodes = require('../lib/checks/canMultiplyLikeTermConstantNodes');

const TestUtil = require('./TestUtil');

function testCanBeMultipliedConstants(expr, multipliable) {
  TestUtil.testBooleanFunction(canMultiplyLikeTermConstantNodes, expr, multipliable);
}

describe('can multiply like term constants', () => {
  const tests = [
    ['3^2 * 3^5', true],
    ['2^3 * 3^2', false],
    ['10^3 * 10^2', true],
    ['10^2 * 10 * 10^4', true]
  ];
  tests.forEach(t => testCanBeMultipliedConstants(t[0], t[1]));
});
