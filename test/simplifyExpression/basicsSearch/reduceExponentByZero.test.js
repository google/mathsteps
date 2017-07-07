const reduceExponentByZero = require('../../../lib/simplifyExpression/basicsSearch/reduceExponentByZero');

const testSimplify = require('./testSimplify');

describe.skip('reduceExponentByZero', function() {
  testSimplify('(x+3)^0', '1', reduceExponentByZero);
});
