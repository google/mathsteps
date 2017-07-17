const NthRootTerm = require('../../lib/node/NthRootTerm');

const TestUtil = require('../TestUtil');

function testIsNthRootTerm(exprStr, isTerm) {
  TestUtil.testBooleanFunction(NthRootTerm.isNthRootTerm, exprStr, isTerm);
}

describe('classifies nth root terms correctly', function() {
  const tests = [
    ['nthRoot(3)', true],
    ['nthRoot(4, 3)', true],
    ['nthRoot(x)', true],
    ['nthRoot(x)^2', true],
    ['nthRoot(4*x^2, 2)', true],
    ['4nthRoot(x)', true],
    ['2*nthRoot(3,2)', true],
    ['-nthRoot(y^2)', true],
    ['nthRoot(x) * nthRoot(x)', false],
    ['nthRoot(2) + nthRoot(5)', false],
    ['3', false],
    ['x', false],
    ['y^5', false],
  ];
  tests.forEach(t => testIsNthRootTerm(t[0], t[1]));
});
