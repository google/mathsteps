const absoluteValue = require('../../../lib/simplifyExpression/functionsSearch/absoluteValue');

const TestUtil = require('../../TestUtil');

function testAbsoluteValue(exprString, outputStr) {
  TestUtil.testSimplification(absoluteValue, exprString, outputStr);
}

describe('abs', function () {
  const tests = [
    ['|4|', '4'],
    ['|-5|', '5'],
  ];
  tests.forEach(t => testAbsoluteValue(t[0], t[1]));
});
