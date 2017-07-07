const removeMultiplicationByOne = require('../../../lib/simplifyExpression/basicsSearch/removeMultiplicationByOne');

const testSimplify = require('./testSimplify');

describe.skip('removeMultiplicationByOne', function() {
  const tests = [
    ['x*1', 'x'],
    ['1x', 'x'],
    ['1*z^2', 'z^2'],
    ['2*1*z^2', '2 * 1z^2'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], removeMultiplicationByOne));
});
