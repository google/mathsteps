const removeExponentBaseOne = require('../../../lib/simplifyExpression/basicsSearch/removeExponentBaseOne');

const testSimplify = require('./testSimplify');

describe('removeExponentBaseOne', function() {
  const tests = [
    ['1^3', '1'],
    ['1^x', '1^x'],
    ['1^(2 + 3 + 5/4 + 7 - 6/7)', '1']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], removeExponentBaseOne));
});
