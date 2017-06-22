const removeDivisionByOne = require('../../../lib/simplifyExpression/basicsSearch/removeDivisionByOne');

const testSimplify = require('./testSimplify');

describe('removeDivisionByOne', function() {
  const tests = [
    ['x/1', 'x'],
    ['x/-1', '-x'],
    ['-x/-1', 'x']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], removeDivisionByOne));
});
