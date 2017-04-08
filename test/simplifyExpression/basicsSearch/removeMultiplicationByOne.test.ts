import removeMultiplicationByOne = require('../../../lib/simplifyExpression/basicsSearch/removeMultiplicationByOne');
import testSimplify = require('./testSimplify');
describe('removeMultiplicationByOne', () => {
    const tests = [
        ['x*1', 'x'],
        ['1x', 'x'],
        ['1*z^2', 'z^2'],
        ['2*1*z^2', '2 * 1z^2'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], removeMultiplicationByOne));
});
