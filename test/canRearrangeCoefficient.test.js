const canRearrangeCoefficient = require('../lib/checks/canRearrangeCoefficient');

const TestUtil = require('./TestUtil');

function testCanBeRearranged(expr, arrangeable) {
  TestUtil.testBooleanFunction(canRearrangeCoefficient, expr, arrangeable);
}

describe('can rearrange coefficient', () => {
  const tests = [
    ['x*2', true],
    ['y^3 * 7', true]
  ];
  tests.forEach(t => testCanBeRearranged(t[0], t[1]));
});
