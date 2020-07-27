const Negative = require('../lib/Negative')
const TestUtil = require('./TestUtil')

function testNegate(inputString, outputString) {
  TestUtil.testNodeFunction(Negative.negate, inputString, outputString)
}

describe('negate', function() {
  const tests = [
    ['1', '-1'],
    ['-1', '1'],
    ['1/2', '-1/2'],
    ['(x+2)', '-(x + 2)'],
    ['x', '-x'],
    ['x^2', '-x^2'],
    ['-y^3', 'y^3'],
    ['2/3 x', '-2/3 x'],
    ['-5/6 z', '5/6 z'],
  ]
  tests.forEach(t => testNegate(t[0], t[1]))
})
