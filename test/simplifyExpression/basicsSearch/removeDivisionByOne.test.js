const removeDivisionByOne = require('../../../lib/simplifyExpression/basicsSearch/removeDivisionByOne');

const testSimplify = require('./testSimplify');

describe('removeDivisionByOne', function() {
  var tests = [
    ['x/1', 'x'],
    ['-x/1', '-x'],
    ['-3/-1', '3'],
    ['(3x)/-1','-3 x'],
    ['(-3x + 1)/-1', '-(-3 x + 1)']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], removeDivisionByOne));
});
