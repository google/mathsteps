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
    ['(5/x) * x', '(5x) / x'],
    ['2x * 9/x', '(2x * 9) / x'],
    ['-3/8 * 2/4', '(-3 * 2) / (8 * 4)'],
    ['(-1/2) * 4/5', '(-1 * 4) / (2 * 5)'],
    ['4 * (-1/x)', '(4 * -1) / x'],
    ['x * 2y / x', '(x * 2y) / x'],
    ['x/z * 1/2', '(x * 1) / (z * 2)'],
    ['(6y / x) * 4x', '(6y * 4x) / x'],
    ['2x * y / z * 10', '(2x * y * 10) / z'],
    ['-(1/2) * (1/2)', '(-1 * 1) / (2 * 2)'],
    ['x * -(1/x)', '(x * -1) / x'],
    ['-(5/y) * -(x/y)', '(-5 * -x) / (y * y)'],
  ];
  tests.forEach(t => testMultiplyFractionsSearch(t[0], t[1]));
});
