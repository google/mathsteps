import removeExponentByOne = require('../../../lib/simplifyExpression/basicsSearch/removeExponentByOne');
import testSimplify = require('./testSimplify');
describe('removeExponentByOne', () => {
    testSimplify('x^1', 'x', removeExponentByOne);
});
