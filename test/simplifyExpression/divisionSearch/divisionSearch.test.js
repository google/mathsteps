const divisionSearch = require('../../../lib/simplifyExpression/divisionSearch');

const TestUtil = require('../../TestUtil');

function testSimplifyDivision(exprStr, outputStr) {
  TestUtil.testSimplification(divisionSearch, exprStr, outputStr);
}

describe('simplifyDivision', function () {
  const tests = [
    ['6/x/5', '6 / (x * 5)'],
    ['-(6/x/5)', '-(6 / (x * 5))'],
    ['-6/x/5', '-6 / (x * 5)'],
    ['(2+2)/x/6/(y-z)','(2 + 2) / (x * 6 * (y - z))'],
    ['2/x', '2 / x'],
    ['x/(2/3)', 'x * 3/2'],
    ['x / (y/(z+a))', 'x * (z + a) / y'],
    ['x/((2+z)/(3/y))', 'x * (3 / y) / (2 + z)'],
  ];
  tests.forEach(t => testSimplifyDivision(t[0], t[1]));
});
