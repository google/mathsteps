const removeMultiplicationByNegativeOne = require('../../../lib/simplifyExpression/basicsSearch/removeMultiplicationByNegativeOne');

const testSimplify = require('./testSimplify');

describe('removeMultiplicationByNegativeOne', function() {
  const tests = [
    ['-1*x', '-x'],
    ['x^2*-1', '-x^2'],
    ['2x*2*-1', '2x * 2 * -1'], // does not remove multiplication by -1
  ];
  tests.forEach(t => testSimplify(t[0], t[1], removeMultiplicationByNegativeOne));
});
