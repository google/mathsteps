const multiplyFractionsSearch = require('../../../lib/simplifyExpression//multiplyFractionsSearch');

const TestUtil = require('../../TestUtil');

function testMultiplyFractionsSearch(exprString, outputStr) {
  TestUtil.testSimplification(multiplyFractionsSearch, exprString, outputStr);
}

describe('multiplyFractions', function () {
  const tests = [
      ['3 * 1/5 * 5/9', '(3 * 1) / 9'],
      ['3/7 * 10/11', '(3 * 10) / (7 * 11)'],
      ['2 * 5/x', '(2 * 5) / x'],
      ['6/x * 12x * 1/x', '(6 * 12 * 1) / x'],
      ['6/x * x', '(6)'],
      ['2/x * x * 3/x', '(2 * 3) / x'],
      ['2/y * x^2/y * 2y', '(2 * x^2 * 2) / y']
  ];
  tests.forEach(t => testMultiplyFractionsSearch(t[0], t[1]));
});
