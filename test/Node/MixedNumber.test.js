const MixedNumber = require('../../lib/node/MixedNumber')
const TestUtil = require('../TestUtil')

function testIsMixedNumber(input, output) {
  TestUtil.testBooleanFunction(MixedNumber.isMixedNumber, input, output)
}

function testIsNegativeMixedNumber(input, output) {
  TestUtil.testBooleanFunction(MixedNumber.isNegativeMixedNumber, input, output)
}

function testGetWholeNumberValue(inputString, outputString) {
  TestUtil.testNodeFunction(
    MixedNumber.getWholeNumberValue, inputString, outputString)
}

function testGetNumeratorValue(inputString, outputString) {
  TestUtil.testNodeFunction(
    MixedNumber.getNumeratorValue, inputString, outputString)
}

function testGetDenominatorValue(inputString, outputString) {
  TestUtil.testNodeFunction(
    MixedNumber.getDenominatorValue, inputString, outputString)
}

// TODO(porting): we can probably remove this - it's kinda weird and is only
// here for a thing socratic needed. I don't think it makes sense to treat this
// kind of string as a mixed number anyways.

describe.skip('isMixedNumber', function () {
  const tests = [
    ['5(1)/(6)', true],
    ['19(2)/(3)', true],
    ['-1(7)/(8)', true],
    ['4*(1/2)', false],
    ['(1/2)3', false],
    ['3*10/15', false],
  ]
  tests.forEach(t => testIsMixedNumber(t[0], t[1]))
})

describe.skip('isNegativeMixedNumber', function () {
  const tests = [
    ['-1(7)/(8)', true],
    ['5(1)/(6)', false],
    ['19(2)/(3)', false],
  ]
  tests.forEach(t => testIsNegativeMixedNumber(t[0], t[1]))
})

describe.skip('getWholeNumber', function () {
  const tests = [
    ['5(1)/(6)', 5],
    ['19(2)/(3)', 19],
    ['-1(7)/(8)', 1],
  ]
  tests.forEach(t => testGetWholeNumberValue(t[0], t[1]))
})

describe.skip('getNumerator', function () {
  const tests = [
    ['5(1)/(6)', 1],
    ['19(2)/(3)', 2],
    ['-1(7)/(8)', 7],
  ]
  tests.forEach(t => testGetNumeratorValue(t[0], t[1]))
})

describe.skip('getDenominator', function () {
  const tests = [
    ['5(1)/(6)', 6],
    ['19(2)/(3)', 3],
    ['-1(7)/(8)', 8],
  ]
  tests.forEach(t => testGetDenominatorValue(t[0], t[1]))
})
