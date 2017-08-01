const assert = require('assert');
const math = require('mathjs');

const print = require('../../lib/util/print');

const simplify = require('../../lib/simplifyExpression/simplify');

function testSimplify(exprStr, outputStr, debug=false) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print.ascii(simplify(math.parse(exprStr), debug)),
      outputStr);
  });
}

describe('simplify (arithmetic)', function () {
  const tests = [
    ['(2+2)*5', '20'],
    ['(8+(-4))*5', '20'],
    ['5*(2+2)*10', '200'],
    ['(2+(2)+7)', '11'],
    ['(8-2) * 2^2 * (1+1) / (4 /2) / 5', '24/5'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('collects and combines like terms', function() {
  const tests = [
    ['x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6', '5x^3 - 8x^2 + 6'],
    ['2x^2 * y * x * y^3', '2x^3 * y^4'],
    ['4y*3*5', '60y'],
    ['(2x^2 - 4) + (4x^2 + 3)', '6x^2 - 1'],
    ['(2x^1 + 4) + (4x^2 + 3)', '4x^2 + 2x + 7'],
    ['y * 2x * 10', '20x * y'],
    ['x^y * x^z', 'x^(y + z)'],
    ['x^(3+y) + x^(3+y)+ 4', '2x^(3 + y) + 4'],
    ['x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6', '5x^3 - 8x^2 + 6'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});


describe('can simplify with division', function () {
  const tests = [
    ['2 * 4 / 5 * 10 + 3', '19'],
    ['2x * 5x / 2', '5x^2'],
    ['2x * 4x / 5 * 10 + 3', '16x^2 + 3'],
    ['2x * 4x / 2 / 4', 'x^2'],
    ['2x * y / z * 10', '(20x * y) / z'],
    ['2x * 4x / 5 * 10 + 3', '16x^2 + 3'],
    ['2x/x', '2'],
    ['2x/4/3', '1/6 x'],
    ['((2+x)(3+x))/(2+x)', '3 + x'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
  // TODO: factor the numerator to cancel out with denominator
  // e.g. (x^2 - 3 + 2)/(x-2) -> (x-1)
});

describe('subtraction support', function() {
  const tests = [
    ['-(-(2+3))', '5'],
    ['-(-5)', '5'],
    ['-(-(2+x))', '2 + x'],
    ['-------5', '-5'],
    ['--(-----5) + 6', '1'],
    ['x^2 + 3 - x*x', '3'],
    ['-(2*x) * -(2 + 2)', '8x'],
    ['(x-4)-5', 'x - 9'],
    ['5-x-4', '-x + 1'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('support for more * and ( that come from latex conversion', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(12*z^(2))/27', '4/9 z^2'],
    ['x^2 - 12x^2 + 5x^2 - 7', '-6x^2 - 7'],
    ['-(12 x ^ 2)', '-12x^2']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('distribution', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(3+x)*(4+x)*(x+5)', 'x^3 + 12x^2 + 47x + 60'],
    ['-2x^2 * (3x - 4)', '-6x^3 + 8x^2'],
    ['x^2 - x^2*(12 + 5x) - 7', '-5x^3 - 11x^2 - 7'],
    ['(5+x)*(x+3)', 'x^2 + 8x + 15'],
    ['(x-2)(x-4)', 'x^2 - 6x + 8'],
    ['- x*y^4 (6x * y^2 + 5x*y - 3x)',
      '-6x^2 * y^6 - 5x^2 * y^5 + 3x^2 * y^4'],
    ['(nthRoot(x, 2))^2', 'x'],
    ['(nthRoot(x, 2))^4', 'x^2'],
    ['3 * (nthRoot(x, 2))^2', '3x'],
    ['(nthRoot(x, 2))^6 * (nthRoot(x, 3))^3', 'x^4'],
    ['(x - 2)^2', 'x^2 - 4x + 4'],
    ['(3x + 5)^2', '9x^2 + 30x + 25'],
    ['(2x + 3)^2','4x^2 + 12x + 9'],
    ['(x + 3 + 4)^2', 'x^2 + 14x + 49'],
    // TODO: ideally this can happen in one step
    // the current substeps are (nthRoot(x^2, 2))^2 -> nthRoot(x^2, 2) * nthRoot(x^2, 2)
    // -> x * x -> x
    ['(nthRoot(x, 2) * nthRoot(x, 2))^2', 'x^2'],
    // TODO: fix nthRoot to evaluate nthRoot(x^3, 2)
    ['(nthRoot(x, 2))^3', 'nthRoot(x ^ 3, 2)'],
    ['3 * nthRoot(x, 2) * (nthRoot(x, 2))^2', '3 * nthRoot(x ^ 3, 2)'],
    // TODO: expand power for base with multiplication
    //['(nthRoot(x, 2) * nthRoot(x, 3))^2', '(nthRoot(x, 2) * nthRoot(x, 3))^2'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('fractions', function() {
  const tests = [
    ['5x + (1/2)x', '11/2 x'],
    ['x + x/2', '3/2 x'],
    ['1 + 1/2', '3/2'],
    ['2 + 5/2 + 3', '15/2'],
    ['9/18-5/18', '2/9'],
    ['2(x+3)/3', '2x / 3 + 2'],
    ['(2 / x) * x', '2'],
    ['5/18 - 9/18', '-2/9'],
    ['9/18', '1/2'],
    ['x/(2/3) + 5', '3/2 x + 5'],
    ['(2+x)/6', '1/3 + x / 6']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('floating point', function() {
  testSimplify('1.983*10', '19.83');
});

describe('cancelling out', function() {
  const tests = [
    ['(x^3*y)/x^2 + 5', 'x * y + 5'],
    ['(x^(2)+y^(2))/(5x-6x) + 5', '-x - y^2 / x + 5'],
    ['( p ^ ( 2) + 1)/( p ^ ( 2) + 1)', '1'],
    ['(-x)/(x)', '-1'],
    ['(x)/(-x)', '-1'],
    ['((2x^3 y^2)/(-x^2 y^5))^(-2)', '(-2x * y^-3)^-2'],
    ['(1+2a)/a', '1 / a + 2'],
    ['(x ^ 4 * y + -(x ^ 2 * y ^ 2)) / (-x ^ 2 * y)', '-x^2 + y'],
    ['6 / (2x^2)', '3 / (x^2)'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('absolute value support', function() {
  const tests = [
    ['(x^3*y)/x^2 + abs(-5)', 'x * y + 5'],
    ['-6 + -5 - abs(-4) + -10 - 3 abs(-4)', '-37'],
    ['5*abs((2+2))*10', '200'],
    ['5x + (1/abs(-2))x', '11/2 x'],
    ['abs(5/18-abs(9/-18))', '2/9'],
    // handle parens around abs()
    ['( abs( -3) )/(3)', '1'],
    ['- abs( -40)', '-40'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('nthRoot support', function() {
  const tests = [
    ['nthRoot(4x, 2)', '2 * nthRoot(x, 2)'],
    ['2 * nthRoot(4x, 2)', '4 * nthRoot(x, 2)'],
    ['(x^3*y)/x^2 + nthRoot(4x, 2)', 'x * y + 2 * nthRoot(x, 2)'],
    ['2 + nthRoot(4)', '4'],
    ['x * nthRoot(x^4, 2)', 'x^3'],
    ['x * nthRoot(2 + 2, 3)', 'x * nthRoot(4, 3)'],
    ['x * nthRoot((2 + 2) * 2, 3)', '2x'],
    ['nthRoot(x * (2 + 3) * x, 2)', 'x * nthRoot(5, 2)']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('handles unnecessary parens at root level', function() {
  const tests = [
    ['(x+(y))', 'x + y'],
    ['((x+y) + ((z^3)))', 'x + y + z^3'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1], t[2]));
});

describe('keeping parens in important places, on printing', function() {
  testSimplify('2 / (3x^2) + 5', '2 / (3x^2) + 5');
});
