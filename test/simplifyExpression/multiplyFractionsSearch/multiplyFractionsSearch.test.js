const multiplyFractionsSearch = require('../../../lib/simplifyExpression//multiplyFractionsSearch');

const TestUtil = require('../../TestUtil');

function testMultiplyFractionsSearch(exprString, outputStr) {
  TestUtil.testSimplification(multiplyFractionsSearch, exprString, outputStr);
}

describe('multiplyFractions', function () {
  const tests = [
    ['3 * 1/5 * 5/9', '(3 * 1 * 5) / (5 * 9)'],
    ['3/7 * 10/11', '(3 * 10) / (7 * 11)'],
    ['2 * 5/x', '(2 * 5) / x'],
    ['2 * (5/x)', '(2 * 5) / x'],
    ['(5/x) * (2/x)', '(5 * 2) / (x * x)'],
  ];
  tests.forEach(t => testMultiplyFractionsSearch(t[0], t[1]));
});
