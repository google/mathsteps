const reduceExponentByZero = require('../../../lib/simplifyExpression/basicsSearch/reduceExponentByZero');

const testSimplify = require('./testSimplify');

describe('reduceExponentByZero', function() {
  testSimplify('(x+3)^0', '1', reduceExponentByZero);
});
