const factorQuadratic = require('../../lib/factor/factorQuadratic');
const TestUtil = require('../TestUtil');

function testFactorQuadratic(input, output) {
  TestUtil.testSimplification(factorQuadratic, input, output);
}

describe('factorQuadratic no change', function () {
  const tests = [
    ['x^2', 'x^2'],
    ['x^2 + x^2', 'x^2 + x^2'],
    ['x^2 + 2 - 3', 'x^2 + 2 - 3'],
    ['x^2 + 2y + 2x + 3', 'x^2 + 2 y + 2 x + 3'], // TODO(printing) space after coefficient
    ['x^2 + 4', 'x^2 + 4'],
    ['x^2 + 4 + 2^x', 'x^2 + 4 + 2^x'],
    ['-x^2 - 1', '-x^2 - 1'],
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});

describe('factorQuadratic factor symbol', function () {
  const tests = [
    ['x^2 + 2x', 'x (x + 2)'],
    ['-x^2 - 2x', '-x (x + 2)'],
    ['x^2 - 3x', 'x (x - 3)'],
    ['2x^2 + 4x', '(2 x) (x + 2)'], // TODO(printing) space after coefficient, 2x doesn't need parens
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});

describe('factorQuadratic difference of squares', function () {
  const tests = [
    ['x^2 - 4', '(x + 2) (x - 2)'],
    ['-x^2 + 1', '-(x + 1) (x - 1)'],
    ['4x^2 - 9', '(2 x + 3) (2 x - 3)'], // TODO(printing) space after coefficient
    ['4x^2 - 16', '4 ((x + 2) (x - 2))'],      // TODO(printing and porting) don't need extra parens
    ['-4x^2 + 16', '-4 ((x + 2) (x - 2))'],    // ... also should this be flattened somewhere? so do we still need flatten?
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});

describe('factorQuadratic perfect square', function () {
  const tests = [
    ['x^2 + 2x + 1', '(x + 1)^2'],
    ['x^2 - 2x + 1', '(x - 1)^2'],
    ['-x^2 - 2x - 1', '-(x + 1)^2'],
    ['4x^2 + 4x + 1', '(2 x + 1)^2'], // TODO(printing) space after coefficient
    ['12x^2 + 12x + 3', '3 (2 x + 1)^2'], // TODO(printing) space after coefficient
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});

describe('factorQuadratic sum product rule', function () {
  const tests = [
    ['x^2 + 3x + 2', '(x + 1) (x + 2)'],
    ['x^2 - 3x + 2', '(x - 1) (x - 2)'],
    ['x^2 + x - 2', '(x - 1) (x + 2)'],
    ['-x^2 - 3x - 2', '-(x + 1) (x + 2)'],
    ['2x^2 + 5x + 3','(x + 1) (2 x + 3)'], // TODO(printing) space after coefficient
    ['2x^2 - 5x - 3','(2 x + 1) (x - 3)'], // TODO(printing) space after coefficient
    ['2x^2 - 5x + 3','(x - 1) (2 x - 3)'], // TODO(printing) space after coefficient
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});

describe('factorQuadratic TODO quadratic equation (no change now)', function () {
  const tests = [
    ['x^2 + 4x + 1', 'x^2 + 4 x + 1'], // TODO(printing) space after coefficient
    ['x^2 - 3x + 1', 'x^2 - 3 x + 1'], // TODO(printing) space after coefficient
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});
