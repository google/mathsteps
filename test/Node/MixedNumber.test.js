const MixedNumber = require('../../lib/node/MixedNumber');
const TestUtil = require('../TestUtil');

function testIsMixedNumber(input, output) {
  TestUtil.testBooleanFunction(MixedNumber.isMixedNumber, input, output);
}

function testIsNegativeMixedNumber(input, output) {
  TestUtil.testBooleanFunction(MixedNumber.isNegativeMixedNumber, input, output);
}

function testGetWholeNumberValue(input, output) {
  input = TestUtil.parseAndFlatten(input);
  TestUtil.testFunctionOutput(MixedNumber.getWholeNumberValue, input, output);
}

function testGetNumeratorValue(input, output) {
  input = TestUtil.parseAndFlatten(input);
  TestUtil.testFunctionOutput(MixedNumber.getNumeratorValue, input, output);
}

function testGetDenominatorValue(input, output) {
  input = TestUtil.parseAndFlatten(input);
  TestUtil.testFunctionOutput(MixedNumber.getDenominatorValue, input, output);
}

describe('isMixedNumber', function () {
  const tests = [
    ['5(1)/(6)', true],
    ['19(2)/(3)', true],
    ['-1(7)/(8)', true],
    ['4*(1/2)', false],
    ['(1/2)3', false],
    ['3*10/15', false],
  ];
  tests.forEach(t => testIsMixedNumber(t[0], t[1]));
});

describe('isNegativeMixedNumber', function () {
  const tests = [
    ['-1(7)/(8)', true],
    ['5(1)/(6)', false],
    ['19(2)/(3)', false],
  ];
  tests.forEach(t => testIsNegativeMixedNumber(t[0], t[1]));
});

describe('getWholeNumber', function () {
  const tests = [
    ['5(1)/(6)', 5],
    ['19(2)/(3)', 19],
    ['-1(7)/(8)', 1],
  ];
  tests.forEach(t => testGetWholeNumberValue(t[0], t[1]));
});

describe('getNumerator', function () {
  const tests = [
    ['5(1)/(6)', 1],
    ['19(2)/(3)', 2],
    ['-1(7)/(8)', 7],
  ];
  tests.forEach(t => testGetNumeratorValue(t[0], t[1]));
});

describe('getDenominator', function () {
  const tests = [
    ['5(1)/(6)', 6],
    ['19(2)/(3)', 3],
    ['-1(7)/(8)', 8],
  ];
  tests.forEach(t => testGetDenominatorValue(t[0], t[1]));
});
