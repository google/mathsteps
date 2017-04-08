import multiplyFractionsSearch = require('../../../lib/simplifyExpression//multiplyFractionsSearch');
import TestUtil = require('../../TestUtil');

function testMultiplyFractionsSearch(exprString: any, outputStr: any);
function testMultiplyFractionsSearch(exprString, outputStr) {
  TestUtil.testSimplification(multiplyFractionsSearch, exprString, outputStr);
}

describe('multiplyFractions', () => {
    const tests = [
        ['3 * 1/5 * 5/9', '(3 * 1 * 5) / (5 * 9)'],
        ['3/7 * 10/11', '(3 * 10) / (7 * 11)'],
        ['2 * 5/x', '(2 * 5) / x']
    ];
    tests.forEach(t => testMultiplyFractionsSearch(t[0], t[1]));
});
