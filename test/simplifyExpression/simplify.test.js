const assert = require('assert')
const math = require('mathjs')

const print = require('../../lib/util/print')

const simplify = require('../../lib/simplifyExpression/simplify')

function testSimplify(exprStr, outputStr, debug = false, ctx) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print.ascii(simplify(math.parse(exprStr), debug, ctx)),
      outputStr)
  })
}

describe('simplify (arithmetic)', function () {
  const tests = [
    ['(2+2)*5', '20'],
    ['(8+(-4))*5', '20'],
    ['5*(2+2)*10', '200'],
    ['(2+(2)+7)', '11'],
    ['(8-2) * 2^2 * (1+1) / (4 /2) / 5', '24/5'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

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
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})


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
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
  // TODO: factor the numerator to cancel out with denominator
  // e.g. (x^2 - 3 + 2)/(x-2) -> (x-1)
})

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
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('support for more * and ( that come from latex conversion', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(12*z^(2))/27', '4/9 z^2'],
    ['x^2 - 12x^2 + 5x^2 - 7', '-6x^2 - 7'],
    ['-(12 x ^ 2)', '-12x^2']
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

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
    // Expanding exponents
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

    // -------------------------------------------------------------------------
    // Cases from al_distribute_over_mult
    // Expanding negative exponents
    ['(x y)^-1', '1 / (x * y)'],
    ['(x y z)^-a', '1 / (x^a * y^a * z^a)'],
    // Distributing exponents to base
    ['(x y)^2', 'x^2 * y^2'],

    // TODO: Is original result correct?
    // ['(x y)^(2x)' ,'x^2 * x * y^2 * x'],
    ['(x y)^(2x)' ,'x^(2x) * y^(2x)'],

    ['((x + 1) y)^2', 'x^2 * y^2 + 2x * y^2 + y^2'],
    ['(2x * y * z)^2', '4x^2 * y^2 * z^2'],
    ['(2x^2 * 3y^2)^2', '36x^4 * y^4'],
    // TODO: works but sometimes returns a timeout error
    // ['((x + 1)^2 (x + 1)^2)^2', 'x^8 + 8x^7 + 28x^6 + 56x^5 + 70x^4 + 56x^3 + 28x^2 + 8x + 1'],
    ['(x * y * (2x + 1))^2', '4x^4 * y^2 + 2x^3 * y^2 + 2x^3 * y^2 + x^2 * y^2'],
    ['((x + 1) * 2y^2 * 2)^2', '16x^2 * y^4 + 16y^4 * x + 16y^4 * x + 16y^4'],
    ['(2x * (x + 1))^2', '4x^4 + 8x^3 + 4x^2'],
    ['(x^2 y)^2.5', 'x^5 * y^2.5'],
    // Fractional exponents
    ['(x^2 y^2)^(1/2)', 'x * y'],
    ['(x^3 y^3)^(1/3)', 'x * y'],
    ['(2x^2 * y^2)^(1/2)', '2^1 / 2 * x * y'],
    // nthRoot to a power
    ['(nthRoot(x, 2) * nthRoot(x, 2))^2', 'x^2'],
    ['(nthRoot(x, 2))^3', 'x^3 / 2'],
    ['3 * nthRoot(x, 2) * (nthRoot(x, 2))^2', '3 * nthRoot(x, 2) * x'],
    ['(nthRoot(x, 2) * nthRoot(x, 3))^2', 'x^5 / 3'],
    ['nthRoot(x, 2)^(1/2)', 'x^1 / 4'],
    ['(nthRoot(x^2, 2)^2 * nthRoot(x, 3)^3)^2', 'x^6'],
    // -------------------------------------------------------------------------

    ['(nthRoot(x, 2) * nthRoot(x, 2))^2', 'x^2'],
    // TODO: fix nthRoot to evaluate nthRoot(x^3, 2)
    ['(nthRoot(x, 2))^3', 'nthRoot(x ^ 3, 2)'],
    ['3 * nthRoot(x, 2) * (nthRoot(x, 2))^2', '3 * nthRoot(x ^ 3, 2)'],
    // TODO: expand power for base with multiplication
    // ['(nthRoot(x, 2) * nthRoot(x, 3))^2', '(nthRoot(x, 2) * nthRoot(x, 3))^2'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

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
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('floating point', function() {
  testSimplify('1.983*10', '1983/100')
})

describe('cancelling out', function() {
  const tests = [
    ['(x^3*y)/x^2 + 5', 'x * y + 5'],
    ['(x^(2)+y^(2))/(5x-6x) + 5', '-x - y^2 / x + 5'],
    ['( p ^ ( 2) + 1)/( p ^ ( 2) + 1)', '1'],
    ['(-x)/(x)', '-1'],
    ['(x)/(-x)', '-1'],
    /* KEMU OLD:   ['((2x^3 y^2)/(-x^2 y^5))^(-2)', '(-2x * y^-3)^-2'], */
    /* KEMU NEW:*/ ['((2x^3 y^2)/(-x^2 y^5))^(-2)', 'y^6 / (4x^2)'],
    ['(1+2a)/a', '1 / a + 2'],
    ['(x ^ 4 * y + -(x ^ 2 * y ^ 2)) / (-x ^ 2 * y)', '-x^2 + y'],
    ['6 / (2x^2)', '3 / (x^2)'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

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
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

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
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('handles unnecessary parens at root level', function() {
  const tests = [
    ['(x+(y))', 'x + y'],
    ['((x+y) + ((z^3)))', 'x + y + z^3'],
  ]
  tests.forEach(t => testSimplify(t[0], t[1], t[2]))
})

describe('keeping parens in important places, on printing', function() {
  testSimplify('2 / (3x^2) + 5', '2 / (3x^2) + 5')
})

describe('kemu extensions', function() {
  const tests = [
    // Basic.
    ['((2 pi)^2)/(4*pi)', 'pi'],
    ['sqrt((2 pi) ^ 2 / (4 pi ^ 2))' , '1'],
    ['(a*b*c*d)^2', 'a^2 * b^2 * c^2 * d^2'],
    ['(4 pi^2)/(4*pi)', 'pi'],
    ['sqrt(a)*sqrt(a)', 'a'],
    ['(2 * sqrt(pi))*(sqrt(((2 pi)^2)/(4*pi)))', '2pi'],
    ['a*b*c*d', 'a * b * c * d'],
    ['pi*((1/pi)^2)', '1 / pi'],
    ['pi*1/pi^2', '1 / pi'],
    ['x*a/x^2', 'a / x'],
    ['(pi^2)^3', 'pi^6'],
    ['x*(1/x)', '1'],
    ['x*(a/x)', 'a'],
    ['(a*x)*(b/x)', 'a * b'],
    ['pi*((sqrt(2))^2)', '2pi'],
    ['sqrt(x)^3', 'x^(3/2)'],
    ['(2*pi)*sqrt(2)', '2pi * sqrt(2)'],
    ['2 * pi * 1 / pi', '2'],
    ['2 pi * 1 / x', '2pi / x'],
    ['4 / (4pi)', '1 / pi'],
    ['(x/a) * (b/x)', 'b / a'],
    ['x*sqrt(pi) * sqrt(a)*3', '3x * sqrt(a * pi)'],
    ['pi ^ -1', '1 / pi'],
    ['x/(d*x*e)', '1 / (d * e)'],
    ['pi * (1 / pi) ^ 2', '1 / pi'],
    ['sqrt(1/pi)', '1 / sqrt(pi)'],
    ['sqrt(x^2)', 'abs(x)'],
    ['sqrt(x^6)', 'sqrt(x ^ 6)'],
    ['sqrt(pi^2)', 'pi'],
    ['sqrt(pi^6)', 'pi^3'],
    ['2*5x^2 + sqrt(5)', '10x^2 + sqrt(5)'],
    ['5^2-4*sqrt(2)*(-8)', '25 + (32 * sqrt(2))'], // TODO: 25 + 32 * sqrt(2)
    ['2-3*sqrt(5)*(-4)', '2 + (12 * sqrt(5))'],    // TODO: 2 + 12 * sqrt(5)

    // Sqrt from const (simple radicand).
    ['sqrt(0)', '0'],
    ['sqrt(1)', '1'],
    ['sqrt(2)', 'sqrt(2)'],
    ['sqrt(4)', '2'],
    ['sqrt(8)', '2 * sqrt(2)'],
    ['sqrt(245)', '7 * sqrt(5)'],
    ['sqrt(352512)', '144 * sqrt(17)'],
    ['sqrt(434957043)', '12041 * sqrt(3)'],

    // Sqrt from const (complex radicand).
    ['sqrt(2x)', 'sqrt(2 x)'],
    ['sqrt(4x)', '2 * sqrt(x)'],
    ['sqrt(12x)', '2 * sqrt(3 * x)'],
    ['sqrt(434957043*x)', '12041 * sqrt(3 * x)'],
    ['sqrt(x * 4 * y)', '2 * sqrt(x * y)'],
    ['sqrt(x * 434957043 * y)', '12041 * sqrt(3 * x * y)'],

    // Multiply order: Nothing changed
    ['x', 'x'],
    ['x y', 'x * y'],
    ['3 x y', '3x * y'],

    // Multiply order: Changed
    ['y x', 'x * y'],
    ['y z x a', 'a * x * y * z'],
    ['y z * 4 * x a', '4a * x * y * z'],

    // Collect like terms with mixed symbols (xy like)
    ['x y + x y', '2x * y'],
    ['2 x y + 3 x y', '5x * y'],

    // Short multiplication formulas
    ['(x + y)^2', 'x^2 + 2x * y + y^2'],
    ['(x - y)^2', 'x^2 - 2x * y + y^2'],
    ['(x + y)^3', 'x^3 + 3y * x^2 + 3x * y^2 + y^3'],
    ['(x - y)^3', 'x^3 - 3y * x^2 + 3x * y^2 - y^3'],
    ['(x + y)^10', 'x^10 + 10y * x^9 + 45x^8 * y^2 + 120x^7 * y^3 + 210x^6 * y^4 + 252x^5 * y^5 + 210x^4 * y^6 + 120x^3 * y^7 + 45x^2 * y^8 + 10x * y^9 + y^10'],
    ['(x - y)^10', 'x^10 - 10y * x^9 + 45x^8 * y^2 - 120x^7 * y^3 + 210x^6 * y^4 - 252x^5 * y^5 + 210x^4 * y^6 - 120x^3 * y^7 + 45x^2 * y^8 - 10x * y^9 + y^10'],

    // Short multiplication formulas: negative exponents.
    ['(x + y)^0'    , '1'],
    ['(x + y)^(-1)' , '1 / (x + y)'],
    ['(x + y)^(-2)' , '1 / (x^2 + 2x * y + y^2)'],
    ['(x + y)^(-10)', '1 / (x^10 + 10y * x^9 + 45x^8 * y^2 + 120x^7 * y^3 + 210x^6 * y^4 + 252x^5 * y^5 + 210x^4 * y^6 + 120x^3 * y^7 + 45x^2 * y^8 + 10x * y^9 + y^10)'],
    ['(x - y)^(-10)', '1 / (x^10 - 10y * x^9 + 45x^8 * y^2 - 120x^7 * y^3 + 210x^6 * y^4 - 252x^5 * y^5 + 210x^4 * y^6 - 120x^3 * y^7 + 45x^2 * y^8 - 10x * y^9 + y^10)'],

    // Other.
    ['a / ((b/c) * d)', 'a * c / (b * d)'],

    // Trigonometric functions.
    ['-sin(0)'       , '0'],
    ['sin(pi/6)'     , '1/2'],
    ['sin(pi/4)'     , 'sqrt(2) / 2'],
    ['sin(pi/3)'     , 'sqrt(3) / 2'],
    ['sin(pi/2)'     , '1'],
    ['sin(pi)'       , '0'],
    ['-sin(0*x)'     , '0'],
    ['sin(-4 pi/24)' , '-1/2'],

    ['cos(0)'    , '1'],
    ['cos(pi/6)' , 'sqrt(3) / 2'],
    ['cos(pi/4)' , 'sqrt(2) / 2'],
    ['cos(pi/3)' , '1/2'],
    ['cos(pi/2)' , '0'],
    ['cos(pi)'   , '-1'],

    ['tg(0)'     , '0'],
    ['tg(pi/6)'  , 'sqrt(3) / 3'],
    ['tg(pi/4)'  , '1'],
    ['tg(pi/3)'  , 'sqrt(3)'],

    ['ctg(pi/6)' , 'sqrt(3)'],
    ['ctg(pi/4)' , '1'],
    ['ctg(pi/3)' , 'sqrt(3) / 3'],
    ['ctg(pi/2)' , '0'],

    ['atan(0)'         , '0'],
    ['atan(sqrt(3)/3)' , 'pi / 6'],
    ['atan(1)'         , 'pi / 4'],
    ['atan(sqrt(3))'   , 'pi / 3'],

    ['sin(n)^2 + cos(n)^2' , '1'],
    ['sin(-n)' , '-sin(n)'],
    ['cos(-n)' , 'cos(n)'],
    ['tg(-n)'  , '-tg(n)'],
    ['ctg(-n)' , '-ctg(n)']
  ]

  // Create fake symbolic context to handle domain for PI.
  // We know that PI is positive constant.
  // Possible improvement: default context if not set explicit.
  const ctx = {
    isNumerical: function() {
      return false
    },
    isNodeNonNegative: function(node) {
      let rv = false

      if (node.name === 'pi') {
        // We know that pi constant is non-negative.
        rv = true
      }
      return rv
    }
  }

  tests.forEach(t => testSimplify(t[0], t[1], t[2], ctx))
})
