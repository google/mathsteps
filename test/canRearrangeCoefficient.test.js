const canRearrangeCoefficient = require('../lib/checks/canRearrangeCoefficient');

const TestUtil = require('./TestUtil');

function canBeRearranged(expr, arrangeable) {
  TestUtil.testBooleanFunction(canRearrangeCoefficient, expr, arrangeable);
}

describe('Rearrange coefficient', () => {
  const tests = [
    ['x*2', true],
    ['y^3 * 7', true]
  ];
  tests.forEach(t => canBeRearranged(t[0], t[1]));
});
