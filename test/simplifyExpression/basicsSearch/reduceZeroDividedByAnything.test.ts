import reduceZeroDividedByAnything = require('../../../lib/simplifyExpression/basicsSearch/reduceZeroDividedByAnything');
import testSimplify = require('./testSimplify');
describe('simplify basics', () => {
    const tests = [
        ['0/5', '0'],
        ['0/(x+6+7+x^2+2^y)', '0'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], reduceZeroDividedByAnything));
});
