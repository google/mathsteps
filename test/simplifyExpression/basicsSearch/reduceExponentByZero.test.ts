import reduceExponentByZero = require('../../../lib/simplifyExpression/basicsSearch/reduceExponentByZero');
import testSimplify = require('./testSimplify');
describe('reduceExponentByZero', () => {
    testSimplify('(x+3)^0', '1', reduceExponentByZero);
});
