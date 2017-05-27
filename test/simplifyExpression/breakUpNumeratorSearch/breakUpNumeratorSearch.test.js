const breakUpNumeratorSearch = require('../../../lib/simplifyExpression/breakUpNumeratorSearch');

const TestUtil = require('../../TestUtil');

function testBreakUpNumeratorSearch(exprStr, outputStr) {
  TestUtil.testSimplification(breakUpNumeratorSearch, exprStr, outputStr);
}

describe('breakUpNumerator', function() {
  const tests = [
    ['(x+3+y)/3', '(x / 3 + 3/3 + y / 3)'],
    ['(2+x)/4', '(2/4 + x / 4)'],
    ['2(x+3)/3', '2 * (x / 3 + 3/3)'],
    ['(2x + 3)/(2x + 2)', '((2x + 2) / (2x + 2) + 1 / (2x + 2))'],
    ['(2x - 3)/(2x + 2)', '((2x + 2) / (2x + 2) - 5 / (2x + 2))'],
    ['(2x + 3)/(2x)', '(2x / (2x) + 3 / (2x))'],
    ['(3 + 2x)/(2x)', '(3 / (2x) + 2x / (2x))'],
    ['(4x + 3)/(2x + 2)', '(2 * (2x + 2) / (2x + 2) - 1 / (2x + 2))'],
    // TODO: Pre-sort numerator and denominator 'args'
    // ['(2x)/(3 + 2x)', '((3 + 2x) / (3 + 2x) - 3 / (3 + 2x))'],
    // TODO: Fix beginning checks in 'breakUpNumeratorSearch'
    // ['(2x)/(2x + 3)', '((2x + 3) / (2x + 3)) - 3 / (2x + 3)'],
  ];
  tests.forEach(t => testBreakUpNumeratorSearch(t[0], t[1]));
});
