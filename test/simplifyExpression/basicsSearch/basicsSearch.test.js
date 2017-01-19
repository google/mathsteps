'use strict';

const basicsSearch = require('../../../lib/simplifyExpression/basicsSearch');
const testSimplify = require('./testSimplify');

describe('simplify basics', function () {
  const tests = [
    // removes multiplication by 1
    ['x*1', 'x'],
    ['1x', 'x'],
    ['1*z^2', 'z^2'],
    ['2*1*z^2', '2 * z^2'],
    // removes multiplication by -1
    ['-1*x', '-x'],
    ['x^2*-1', '-x^2'],
    ['2x*2*-1', '2x * 2 * -1'], // does not remove multiplication by -1
    // removeExponentByOne
    ['x^1', 'x'],
    // removeExponentBaseOne
    ['1^3', '1'],
    ['1^x', '1^x'],
    ['1^(2 + 3 + 5/4 + 7 - 6/7)', '1'],
    // simplifyDoubleUnaryMinus
    ['--5', '5'],
    ['--x', 'x'],
    // note the double parens are handled in simplifyExpression.js with a final
    // call to remove unnecessary parens
    ['-(-(2+x))', '((2 + x))'],
    // removeAdditionByZero
    ['2+0+x', '2 + x'],
    // divide by 1
    ['x/1', 'x'],
    // divide by -1
    ['(x+3)/-1', '-(x + 3)'],
    // exponent to 0 -> 1
    ['(x+3)^0', '1'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], basicsSearch));
});
