import simplifyFractionSigns = require('../../../lib/simplifyExpression/fractionsSearch/simplifyFractionSigns');
import TestUtil = require('../../TestUtil');

function testSimplifyFractionSigns(exprStr: any, outputStr: any);
function testSimplifyFractionSigns(exprStr, outputStr) {
  TestUtil.testSimplification(simplifyFractionSigns, exprStr, outputStr);
}

describe('simplify signs', () => {
    const tests = [
        ['-12x / -27', '12x / 27'],
        ['x / -y', '-x / y'],
    ];
    tests.forEach(t => testSimplifyFractionSigns(t[0], t[1]));
});
