'use strict';

const assert = require('assert');
const math = require('mathjs');
const MathChangeTypes = require('../lib/MathChangeTypes');
const solveEquation = require('../lib/solveEquation');

function testSolve(equationString, comparator, outputStr, debug=false) {
  const sides = equationString.split(comparator);
  const leftNode = math.parse(sides[0]);
  const rightNode = math.parse(sides[1]);

  const steps = solveEquation(leftNode, rightNode, comparator, debug);
  let lastStep;
  if (steps.length === 0) {
    lastStep = equationString;
  }
  else {
    lastStep = steps[steps.length -1].asciimath;
  }
  it(equationString + ' -> ' + outputStr, function () {
    assert.equal(lastStep, outputStr);
  });
}

describe('solveEquation for =', function () {
  const tests = [
    ['x = 1', '=', 'x = 1'],
    ['2 = x', '=', 'x = 2'],
    ['2 + -3 = x', '=', 'x = -1'],
    ['x + 3 = 4', '=', 'x = 1'],
    ['2x - 3 = 0', '=', 'x = 3/2'],
    ['x/3 - 2 = -1', '=', 'x = 3'],
    ['5x/2 + 2 = 3x/2 + 10', '=', 'x = 8'],
    ['2x - 1 = -x', '=', 'x = 1/3'],
    ['2 - x = -4 + x', '=', 'x = 3'],
    ['2x/3 = 2', '=', 'x = 3'],
    ['2x - 3 = x', '=', 'x = 3'],
    ['8 - 2a = a + 3 - 1', '=', 'a = 2'],
    ['2 - x = 4', '=', 'x = -2'],
    ['2 - 4x = x', '=', 'x = 2/5'],
    ['9x + 4 - 3 = 2x', '=', 'x = -1/7'],
    ['9x + 4 - 3 = -2x', '=', 'x = -1/11'],
    ['(2x^2 - 1)(x^2 - 5)(x^2 + 5) = 0', '=', '2x^6 - x^4 - 50x^2 = -25'],
    ['(-x ^ 2 - 4x + 2)(-3x^2 - 6x + 3) = 0', '=', '3x^4 + 18x^3 + 15x^2 - 24x = -6'],
    ['5x + (1/2)x = 27 ', '=', 'x = 54/11'],
    ['2x/3 = 2x - 4 ', '=', 'x = 3'],
    ['(-2/3)x + 3/7 = 1/2', '=', 'x = -3/28'],
    ['-9/4v + 4/5 = 7/8 ', '=', 'v = -1/30'],
    ['y - x - 2 = 3*2', '=', 'y = 8 + x'],
    ['2y - x - 2 = x', '=', 'y = x + 1'],
    // TODO: update test once we have root support
    ['x^2 - 2 = 0', '=', 'x^2 = 2'],
    ['x/(2/3) = 1', '=', 'x = 2/3'],
    ['(x+1)/3 = 4', '=', 'x = 11'],
    ['2(x+3)/3 = 2', '=', 'x = 0'],
  ];
  tests.forEach(t => testSolve(t[0], t[1], t[2]));
});

describe('solveEquation for non = comparators', function() {
  const tests = [
    ['x + 2 > 3', '>', 'x > 1'],
    ['2x < 6', '<', 'x < 3'],
    ['-x > 1', '>', 'x < -1'],
    ['2 - x < 3', '<', 'x > -1'],
  ];
  tests.forEach(t => testSolve(t[0], t[1], t[2]));
});

function testSolveConstantEquation(
  equationString, comparator, expectedChange, debug=false) {
  const sides = equationString.split(comparator);
  const leftNode = math.parse(sides[0]);
  const rightNode = math.parse(sides[1]);

  const steps = solveEquation(leftNode, rightNode, comparator, debug);
  const actualChange = steps[steps.length -1].changeType;
  it(equationString + ' -> ' + expectedChange, function () {
    assert.equal(actualChange, expectedChange);
  });
}

describe('constant comparison support', function () {
  const tests = [
    ['1 = 2', '=', MathChangeTypes.STATEMENT_IS_FALSE],
    ['3 + 5 = 8', '=', MathChangeTypes.STATEMENT_IS_TRUE],
    ['1 = 2', '=', MathChangeTypes.STATEMENT_IS_FALSE],
    ['2 - 3 = 5', '=', MathChangeTypes.STATEMENT_IS_FALSE],
    ['2 > 1', '>', MathChangeTypes.STATEMENT_IS_TRUE],
    ['2/3 > 1/3', '>', MathChangeTypes.STATEMENT_IS_TRUE],
    ['1 > 2', '>', MathChangeTypes.STATEMENT_IS_FALSE],
    ['1/3 > 2/3', '>', MathChangeTypes.STATEMENT_IS_FALSE],
    ['1 >= 1', '>=', MathChangeTypes.STATEMENT_IS_TRUE],
    ['2 >= 1', '>=', MathChangeTypes.STATEMENT_IS_TRUE],
    ['1 >= 2', '>=', MathChangeTypes.STATEMENT_IS_FALSE],
    ['2 < 1', '<', MathChangeTypes.STATEMENT_IS_FALSE],
    ['2/3 < 1/3', '<', MathChangeTypes.STATEMENT_IS_FALSE],
    ['1 < 2', '<', MathChangeTypes.STATEMENT_IS_TRUE],
    ['1/3 < 2/3', '<', MathChangeTypes.STATEMENT_IS_TRUE],
    ['1 <= 1', '<=', MathChangeTypes.STATEMENT_IS_TRUE],
    ['2 <= 1', '<=', MathChangeTypes.STATEMENT_IS_FALSE],
    ['1 <= 2', '<=', MathChangeTypes.STATEMENT_IS_TRUE],
    // TODO: when we support fancy exponent and sqrt things
    // ['(1/64)^(-5/6) = 32', '=', MathChangeTypes.STATEMENT_IS_TRUE],
    // With variables that cancel
    ['5 + (x - 5) = x', '=', MathChangeTypes.STATEMENT_IS_TRUE],
    ['4x - 4= 4x', '=', MathChangeTypes.STATEMENT_IS_FALSE],
  ];
  tests.forEach(t => testSolveConstantEquation(t[0], t[1], t[2]));
});
