const arithmeticSearch = require('../../../lib/simplifyExpression/arithmeticSearch')

const TestUtil = require('../../TestUtil')

function testArithmeticSearch(exprStr, outputStr) {
  TestUtil.testSimplification(arithmeticSearch, exprStr, outputStr)
}

describe('evaluate arithmeticSearch', function () {
  const tests = [
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['6*6', '36'],
    ['9/4', '9/4'], // fractions that go to decimals don't divide
    ['16 - 1953125', '-1953109'], // verify large negative number round correctly
  ]
  tests.forEach(t => testArithmeticSearch(t[0], t[1]))
})
