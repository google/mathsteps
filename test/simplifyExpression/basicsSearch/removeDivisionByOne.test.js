const removeDivisionByOne = require('../../../lib/simplifyExpression/basicsSearch/removeDivisionByOne');

const testSimplify = require('./testSimplify');

describe('removeDivisionByOne', function() {
  testSimplify('x/1', 'x', removeDivisionByOne);
});
