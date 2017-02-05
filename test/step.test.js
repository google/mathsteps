const assert = require('assert');
const math = require('mathjs');

const stepThroughExpression = require('../lib/simplifyExpression/stepThrough');

function testStepsInExpression(exprStr, outputStr) {
  it ('test the steps in simplifying expression', function () {
    assert.equal((stepThroughExpression(math.parse(exprStr))[0]['changeType']), outputStr);
  });
}

describe('stepThrough simplifying expression', function () {
  const tests = [
    ['x / x', 'CANCEL_TERMS'],
    ['-2/-3', 'CANCEL_MINUSES'],
    ['2(x + y)', 'DISTRIBUTE'],
    ['x * 2', 'REARRANGE_COEFF'],
    ['x + x', 'ADD_POLYNOMIAL_TERMS'],
    ['nthRoot(x ^ 4, 2)', 'CANCEL_ROOT']
  ];
  tests.forEach(t => testStepsInExpression(t[0], t[1]));
});
