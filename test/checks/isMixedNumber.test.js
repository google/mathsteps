const checks = require('../../lib/checks');
const TestUtil = require('../TestUtil');

function testIsMixedNumber(input, output) {
  TestUtil.testBooleanFunction(checks.isMixedNumber, input, output);
}

describe('isMixedNumber', function () {
  const tests = [
    ['5(1)/(6)', true],
    ['19(2)/(3)', true],
    ['4*(1/2)', false],
    ['(1/2)3', false],
    ['3*10/15', false],
  ];
  tests.forEach(t => testIsMixedNumber(t[0], t[1]));
});
