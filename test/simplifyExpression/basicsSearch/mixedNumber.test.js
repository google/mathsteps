const mixedNumber = require('../../../lib/simplifyExpression/basicsSearch/mixedNumber');
const TestUtil = require('../../TestUtil');

function testIsMixedNumber(input, output) {
  TestUtil.testBooleanFunction(mixedNumber.isMixedNumber, input, output);
}

function testGetWholeNumber(input, output) {
  input = TestUtil.flattenAndParse(input);
  TestUtil.testFunctionOutput(mixedNumber.getWholeNumber, input, output);
}

function testGetNumerator(input, output) {
  input = TestUtil.flattenAndParse(input);
  TestUtil.testFunctionOutput(mixedNumber.getNumerator, input, output);
}

function testGetDenominator(input, output) {
  input = TestUtil.flattenAndParse(input);
  TestUtil.testFunctionOutput(mixedNumber.getDenominator, input, output);
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

describe('getWholeNumber', function () {
  const tests = [
    ['5(1)/(6)', 5],
    ['19(2)/(3)', 19],
  ];
  tests.forEach(t => testGetWholeNumber(t[0], t[1]));
});

describe('getNumerator', function () {
  const tests = [
    ['5(1)/(6)', 1],
    ['19(2)/(3)', 2],
  ];
  tests.forEach(t => testGetNumerator(t[0], t[1]));
});

describe('getDenominator', function () {
  const tests = [
    ['5(1)/(6)', 6],
    ['19(2)/(3)', 3],
  ];
  tests.forEach(t => testGetDenominator(t[0], t[1]));
});
