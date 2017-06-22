const removeExponentByOne = require('../../../lib/simplifyExpression/basicsSearch/removeExponentByOne');

const testSimplify = require('./testSimplify');

describe('removeExponentByOne', function() {
    const tests = [
        ['x^1', 'x'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], removeExponentByOne));
});
