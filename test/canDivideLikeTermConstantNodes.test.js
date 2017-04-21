const canDivideLikeTermConstantNodes = require('../lib/checks/canDivideLikeTermConstantNodes');


const TestUtil = require('./TestUtil');

function testCanBeDividedConstants(expr, multipliable) {
  TestUtil.testBooleanFunction(canDivideLikeTermConstantNodes.canDivideLikeTermConstantNodes, expr, multipliable);
}

describe('can divide like term constants', () => {
  const tests = [
    ['3^2 / 3^5', true],
    ['2^3 / 3^2', false],
    ['10^3 / 10^2', true],
    ['10^6 / 10^4', true]
  ];
  tests.forEach(t => testCanBeDividedConstants(t[0], t[1]));
});
