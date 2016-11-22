'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const print = require('./../lib/print');
const stepper = require('../lib/simplifyExpression');
const simplifyOperations = require('../lib/simplifyOperations');
const stepThrough = stepper.stepThrough;
const MathChangeTypes = require('../lib/MathChangeTypes');

function testSimplify(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplifyOperations(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('simplifies', function () {
  const tests = [
    //performArithmetic
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['9/4', '9/4'], //  does not divide
    ['x*1', 'x'],
    // removes multiplication by 1
    ['1*z^2', 'z^2'],
    ['2*1*z^2', '2 * z^2'],
    // removes multiplication by 0
    ['0x', '0'],
    ['2*0*z^2','0'],
    // removes multiplication by -1
    ['-1*x', '-x'],
    ['x^2*-1', '-x^2'],
    ['2*x*2*-1', '2 * x * 2 * -1'], // does not remove multiplication by -1
    // removeExponentByOne
    ['x^1', 'x'],
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
    // abs
    ['abs(4)', '4'],
    ['abs(-5)', '5'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));

  it('simplifyDoubleUnaryMinus step actually happens: 22 - (-7) -> 22 + 7', function () {
    const steps = stepThrough(math.parse('22 - (-7)'));
    assert.equal(steps[0].explanation, MathChangeTypes.RESOLVE_DOUBLE_UNARY_MINUS);
  });
});
