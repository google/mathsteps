const reduceExponentByZero = require('../../../lib/simplifyExpression/basicsSearch/reduceExponentByZero');

const testSimplify = require('./testSimplify');

describe('reduceExponentByZero', function () {
    const tests = [
        ['(x+3)^0', '1'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], reduceExponentByZero));
});
