const removeExponentByOne = require('../../../lib/simplifyExpression/basicsSearch/removeExponentByOne');

const testSimplify = require('./testSimplify');

describe.skip('removeExponentByOne', function() {
  testSimplify('x^1', 'x', removeExponentByOne);
});
