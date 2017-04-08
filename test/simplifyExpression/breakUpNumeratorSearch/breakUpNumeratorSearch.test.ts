import breakUpNumeratorSearch = require('../../../lib/simplifyExpression/breakUpNumeratorSearch');
import TestUtil = require('../../TestUtil');

function testBreakUpNumeratorSearch(exprStr: any, outputStr: any);
function testBreakUpNumeratorSearch(exprStr, outputStr) {
  TestUtil.testSimplification(breakUpNumeratorSearch, exprStr, outputStr);
}

describe('breakUpNumerator', () => {
    const tests = [
        ['(x+3+y)/3', '(x / 3 + 3/3 + y / 3)'],
        ['(2+x)/4', '(2/4 + x / 4)'],
        ['2(x+3)/3', '2 * (x / 3 + 3/3)'],
    ];
    tests.forEach(t => testBreakUpNumeratorSearch(t[0], t[1]));
});
