'use strict';

const assert = require('assert');

const ChangeTypes = require('../../lib/ChangeTypes');
const solveEquation = require('../../lib/solveEquation');

const NO_STEPS = 'no-steps';

function testSolve(equationString, outputStr, debug=false) {
  const steps = solveEquation(equationString, debug);
  let lastStep;
  if (steps.length === 0) {
    lastStep = NO_STEPS;
  }
  else {
    lastStep = steps[steps.length -1].newEquation.print();
  }
  it(equationString + ' -> ' + outputStr, function () {
    assert.equal(lastStep, outputStr);
  });
}

describe('solveEquation for =', function () {
  const tests = [
    // can't solve this because two symbols: g and x -- so there's no steps
    ['g *( x ) = ( x - 4) ^ ( 2) - 3', NO_STEPS],
    // can't solve this because we don't deal with the complicated fraction yet
    ['( x )/( 2x + 7) >= 4', NO_STEPS],
    ['y - x - 2 = 3*2', 'y = 8 + x'],
    ['2y - x - 2 = x', 'y = x + 1'],
    ['x = 1', NO_STEPS],
    ['2 = x', 'x = 2'],
    ['2 + -3 = x', 'x = -1'],
    ['x + 3 = 4', 'x = 1'],
    ['2x - 3 = 0', 'x = 3/2'],
    ['x/3 - 2 = -1', 'x = 3'],
    ['5x/2 + 2 = 3x/2 + 10', 'x = 8'],
    ['2x - 1 = -x', 'x = 1/3'],
    ['2 - x = -4 + x', 'x = 3'],
    ['2x/3 = 2', 'x = 3'],
    ['2x - 3 = x', 'x = 3'],
    ['8 - 2a = a + 3 - 1', 'a = 2'],
    ['2 - x = 4', 'x = -2'],
    ['2 - 4x = x', 'x = 2/5'],
    ['9x + 4 - 3 = 2x', 'x = -1/7'],
    ['9x + 4 - 3 = -2x', 'x = -1/11'],
    ['(2x^2 - 1)(x^2 - 5)(x^2 + 5) = 0', '2x^6 - x^4 - 50x^2 = -25'],
    ['(-x ^ 2 - 4x + 2)(-3x^2 - 6x + 3) = 0', '3x^4 + 18x^3 + 15x^2 - 24x = -6'],
    ['5x + (1/2)x = 27 ', 'x = 54/11'],
    ['2x/3 = 2x - 4 ', 'x = 3'],
    ['(-2/3)x + 3/7 = 1/2', 'x = -3/28'],
    ['-9/4v + 4/5 = 7/8 ', 'v = -1/30'],
    // TODO: update test once we have root support
    ['x^2 - 2 = 0', 'x^2 = 2'],
    ['x/(2/3) = 1', 'x = 2/3'],
    ['(x+1)/3 = 4', 'x = 11'],
    ['2(x+3)/3 = 2', 'x = 0'],
    ['( u )/( 0.3) = 4u + 6.28', 'u = -9.42'],
    ['- q - 4.36= ( 2.2q )/( 1.8)', 'q = -1.962'],
    // TODO: figure out what to do about errors from rounding midway through
    // this gives us 6.3995 when it should actually be 6.4 :(
    // ['x - 3.4= ( x - 2.5)/( 1.3)', 'x = 6.4']
    ['-32 - (24x) = 34 - (2x)', 'x = -3']
  ];
  tests.forEach(t => testSolve(t[0], t[1], t[2]));
});

describe('solveEquation for non = comparators', function() {
  const tests = [
    ['x + 2 > 3', 'x > 1'],
    ['2x < 6', 'x < 3'],
    ['-x > 1', 'x < -1'],
    ['2 - x < 3', 'x > -1'],
    ['9.5j / 6+ 5.5j >= 3( 5j - 2)', 'j <= 0.7579']
  ];
  tests.forEach(t => testSolve(t[0], t[1], t[2]));
});

function testSolveConstantEquation(
  equationString, expectedChange, debug=false) {
  const steps = solveEquation(equationString, debug);
  const actualChange = steps[steps.length -1].changeType;
  it(equationString + ' -> ' + expectedChange, function () {
    assert.equal(actualChange, expectedChange);
  });
}

describe('constant comparison support', function () {
  const tests = [
    ['1 = 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['3 + 5 = 8', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 = 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['2 - 3 = 5', ChangeTypes.STATEMENT_IS_FALSE],
    ['2 > 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['2/3 > 1/3', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 > 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['1/3 > 2/3', ChangeTypes.STATEMENT_IS_FALSE],
    ['1 >= 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['2 >= 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 >= 2', ChangeTypes.STATEMENT_IS_FALSE],
    ['2 < 1', ChangeTypes.STATEMENT_IS_FALSE],
    ['2/3 < 1/3', ChangeTypes.STATEMENT_IS_FALSE],
    ['1 < 2', ChangeTypes.STATEMENT_IS_TRUE],
    ['1/3 < 2/3', ChangeTypes.STATEMENT_IS_TRUE],
    ['1 <= 1', ChangeTypes.STATEMENT_IS_TRUE],
    ['2 <= 1', ChangeTypes.STATEMENT_IS_FALSE],
    ['1 <= 2', ChangeTypes.STATEMENT_IS_TRUE],
    ['( 1) = ( 14)', ChangeTypes.STATEMENT_IS_FALSE],
    // TODO: when we support fancy exponent and sqrt things
    // ['(1/64)^(-5/6) = 32', ChangeTypes.STATEMENT_IS_TRUE],
    // With variables that cancel
    ['( r )/( ( r ) ) = ( 1)/( 10)', ChangeTypes.STATEMENT_IS_FALSE],
    ['5 + (x - 5) = x', ChangeTypes.STATEMENT_IS_TRUE],
    ['4x - 4= 4x', ChangeTypes.STATEMENT_IS_FALSE],
  ];
  tests.forEach(t => testSolveConstantEquation(t[0], t[1], t[2]));
});

function testEquationError(equationString, debug=false) {
  it(equationString + ' throws error', function () {
    assert.throws(() => solveEquation(equationString, debug),
                  Error);
  });
}

describe('solveEquation errors', function() {
  const tests = [
    ['( x + 2) ^ ( 2) - x ^ ( 2) = 4( x + 1)']
  ];
  tests.forEach(t => testEquationError(t[0], t[1]));
});
