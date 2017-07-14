const convertMixedNumberToImproperFraction = require(
  '../../../lib/simplifyExpression/basicsSearch/convertMixedNumberToImproperFraction');
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

function testConvertMixedNumberToImproperFraction(exprString, outputList, outputStr) {
  TestUtil.testSubsteps(convertMixedNumberToImproperFraction, exprString, outputList, outputStr);
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

describe('convertMixedNumberToImproperFraction', function() {
  const tests = [
    ['1(2)/(3)',
      ['((1 * 3) + 2) / 3',
        '(3 + 2) / 3',
        '5/3'],
      '5/3'
    ],
    ['19(4)/(8)',
      ['((19 * 8) + 4) / 8',
        '(152 + 4) / 8',
        '156/8'],
      '156/8'
    ],
    ['5(10)/(11)',
      ['((5 * 11) + 10) / 11',
        '(55 + 10) / 11',
        '65/11'],
      '65/11'
    ],
  ];
  tests.forEach(t => testConvertMixedNumberToImproperFraction(t[0], t[1], t[2]));
});
