'use strict';

const assert = require('assert');
const math = require('mathjs');
const stepper = require('../lib/simplifyExpression.js');
const step = stepper.step;
const simplify = stepper.simplify;
const stepThrough = stepper.stepThrough;
const flatten = require('../lib/flattenOperands.js');
const print = require('./../lib/print');
const MathChangeTypes = require('../lib/MathChangeTypes');

function testStep(exprStr, outputStr, debug=false) {
  let expr = math.parse(exprStr);
  let nodeStatus = step(expr);
  if (debug) {
    if (!nodeStatus.changeType) {
      throw Error('missing or bad change type');
    }
    // eslint-disable-next-line
    console.log(nodeStatus.changeType);
    // eslint-disable-next-line
    console.log(print(nodeStatus.newNode));
  }
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(nodeStatus.newNode),
      outputStr);
  });
  return nodeStatus.newNode;
}

function testSimplify(exprStr, outputStr, debug=false) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplify(flatten(math.parse(exprStr)), debug)),
      outputStr);
  });
}

describe('arithmetic stepping', function() {
  const tests = [
    ['(2+2)', '4'],
    ['(2+2)*5', '4 * 5'],
    ['5*(2+2)', '5 * 4'],
    ['2*(2+2) + 2^3', '2 * 4 + 2^3'],
  ];
  tests.forEach(t => testStep(t[0], t[1]));
});

describe('handles + - -> - on first step', function() {
  it('2 + (-3) -> 2 - 3', function () {
    const steps = stepThrough(math.parse('2 + (-3)'));
    assert.equal(steps[0].explanation, MathChangeTypes.RESOLVE_ADD_UNARY_MINUS);
  });
  it('22 + (-26) - x - x -> 22 - 26 - x - x', function () {
    const steps = stepThrough(math.parse('22 + (-26) - (-7) - x - x'));
    assert.equal(steps[0].explanation, MathChangeTypes.RESOLVE_ADD_UNARY_MINUS);
  });
});

describe('handles unnecessary parens at root level', function() {
  const tests = [
    ['(x+(y))', 'x + y'],
    ['((x+y) + ((z^3)))', 'x + y + z^3'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});

describe('simplify (arithmetic)', function () {
  const tests = [
    ['(2+2)*5', '20'],
    ['(8+(-4))*5', '20'],
    ['5*(2+2)*10', '200'],
    ['(2+(2)+7)', '11'],
    ['(8-2) * 2^2 * (1+1) / (4 /2) / 5', '24/5'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});

describe('adding symbols without breaking things', function() {
  // nothing old breaks
  const tests = [
    ['2+x', '2 + x'],
    ['(2+2)*x', '4 * x'],
    ['(2+2)*x+3', '4 * x + 3'],
  ];
  tests.forEach(t => testStep(t[0], t[1]));
});

describe('collecting like terms within the context of the stepper', function() {
  const tests = [
    ['2+x+7', 'x + (2 + 7)'],
    ['2x^2 * y * x * y^3', '2 * (x^2 * x) * (y * y^3)'],
    ['y * 5 * (2+3) * y^2', 'y * 5 * 5 * y^2'],
  ];
  tests.forEach(t => testStep(t[0], t[1]));
});

describe('collects and combines like terms', function() {
  const stepTests = [
    ['(x + x) + (x^2 + x^2)', '(1 + 1) * x + (x^2 + x^2)'],
    ['10 + (y^2 + y^2)', '10 + (1 + 1) * y^2'],
    ['x + y + y^2', 'x + y + y^2'],
    ['2x^(2+1)', '2x^3'],
  ];
  stepTests.forEach(t => testStep(t[0], t[1]));

  const simplifyTests = [
    ['x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6', '5x^3 - 8x^2 + 6'],
    ['2x^2 * y * x * y^3', '2 * x^3 * y^4'],
    ['4y*3*5', '60y'],
    ['(2x^2 - 4) + (4x^2 + 3)', '6x^2 - 1'],
    ['(2x^1 + 4) + (4x^2 + 3)', '4x^2 + 2x + 7'],
    ['y * 2x * 10', '20 * x * y'],
    ['x^y * x^z', 'x^(y + z)'],
    ['x^(3+y) + x^(3+y)+ 4', '2x^(3 + y) + 4'],
    ['x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6', '5x^3 - 8x^2 + 6'],
  ];
  simplifyTests.forEach(t => testSimplify(t[0], t[1]));
});

describe('can simplify with division', function () {
  const tests = [
    ['2 * 4 / 5 * 10 + 3', '19'],
    ['2x * 5x / 2', '5x^2'],
    ['2x * 4x / 5 * 10 + 3', '16x^2 + 3'],
    ['2x * 4x / 2 / 4', 'x^2'],
    ['2x * y / z * 10', '20 * x * y / z'],
    ['2x * 4x / 5 * 10 + 3', '16x^2 + 3'],
    ['2x/x', '2'],
    ['2x/4/3', '1/6 x'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
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
  tests.forEach(t => testSimplify(t[0], t[1]));
});

describe('support for more * and ( that come from latex conversion', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(12*z^(2))/27', '4/9 z^2'],
    ['x^2 - 12x^2 + 5x^2 - 7', '-6x^2 - 7'],
    ['-(12 x ^ 2)', '-12x^2']
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});

describe('distribution', function () {
  const tests = [
    ['(3*x)*(4*x)', '12x^2'],
    ['(3+x)*(4+x)*(x+5)', 'x^3 + 12x^2 + 47x + 60'],
    ['-2x^2 * (3x - 4)', '-6x^3 + 8x^2'],
    ['x^2 - x^2*(12 + 5x) - 7', '-5x^3 - 11x^2 - 7'],
    ['(5+x)*(x+3)', 'x^2 + 8x + 15'],
    ['(x-2)(x-4)', 'x^2 - 6x + 8'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});

describe('stepThrough returning no steps', function() {
  it('12x^2 already simplified', function () {
    assert.deepEqual(
      stepThrough(math.parse('12x^2')),
      []);
  });
  it('2*5x^2 + sqrt(5) has unsupported sqrt', function () {
    assert.deepEqual(
      stepThrough(math.parse('2*5x^2 + sqrt(5)')),
      []);
  });
});

describe('fractions', function() {
  const tests = [
    ['5x + (1/2)x', '11/2 x'],
    ['x + x/2', '3/2 x'],
    ['1 + 1/2', '3/2'],
    ['2 + 5/2 + 3', '15/2'],
    ['9/18-5/18', '2/9'],
    ['2(x+3)/3', '2/3 x + 2'],
    ['5/18 - 9/18', '-2/9'],
    ['9/18', '1/2'],
    ['x/(2/3) + 5', '3/2 x + 5'],
    ['(2+x)/6', '1/3 + x / 6']
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));

  // single steps
  testStep('2 + 5/2 + 3', '(2 + 3) + 5/2');
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
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});

describe('keeping parens in important places, on printing', function() {
  testSimplify('2 / (2x^2) + 5', '2 / (2x^2) + 5');
  testStep('5 + (3*6) + 2 / (x / y)', '5 + 18 + 2 / (x / y)');
  testStep('-(x + y) + 5+3', '(5 + 3) - (x + y)');
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
  tests.forEach(t => testSimplify(t[0], t[1]));
});
