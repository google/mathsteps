const simplifyFractionSigns = require('../../../lib/simplifyExpression/fractionsSearch/simplifyFractionSigns');

const TestUtil = require('../../TestUtil');

function testSimplifyFractionSigns(exprStr, outputStr) {
  TestUtil.testSimplification(simplifyFractionSigns, exprStr, outputStr);
}

describe('simplify signs', function() {
  const tests = [
    ['-12x / -27', '12x / 27'],
    ['x / -y', '-x / y'],
  ];
  tests.forEach(t => testSimplifyFractionSigns(t[0], t[1]));
});
