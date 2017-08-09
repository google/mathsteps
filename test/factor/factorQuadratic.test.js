const factorQuadratic = require('../../lib/factor/factorQuadratic');
const TestUtil = require('../TestUtil');

function testFactorQuadratic(input, output) {
  TestUtil.testSimplification(factorQuadratic, input, output);
}

describe('factorQuadratic', function () {
  const tests = [
    // no change
    ['x^2', 'x^2'],
    ['x^2 + x^2', 'x^2 + x^2'],
    ['x^2 + 2 - 3', 'x^2 + 2 - 3'],
    ['x^2 + 2y + 2x + 3', 'x^2 + 2y + 2x + 3'],
    ['x^2 + 4', 'x^2 + 4'],
    ['x^2 + 4 + 2^x', 'x^2 + 4 + 2^x'],
    ['-x^2 - 1', '-x^2 - 1'],
    // factor symbol
    ['x^2 + 2x', 'x * (x + 2)'],
    ['-x^2 - 2x', '-x * (x + 2)'],
    ['x^2 - 3x', 'x * (x - 3)'],
    ['2x^2 + 4x', '2x * (x + 2)'],
    // difference of squares
    ['x^2 - 4', '(x + 2) * (x - 2)'],
    ['-x^2 + 1', '-(x + 1) * (x - 1)'],
    ['4x^2 - 9', '(2x + 3) * (2x - 3)'],
    ['4x^2 - 16', '4 * (x + 2) * (x - 2)'],
    ['-4x^2 + 16', '-4 * (x + 2) * (x - 2)'],
    // perfect square
    ['x^2 + 2x + 1', '(x + 1)^2'],
    ['x^2 - 2x + 1', '(x - 1)^2'],
    ['-x^2 - 2x - 1', '-(x + 1)^2'],
    ['4x^2 + 4x + 1', '(2x + 1)^2'],
    ['12x^2 + 12x + 3', '3 * (2x + 1)^2'],
    // sum product rule
    ['x^2 + 3x + 2', '(x + 1) * (x + 2)'],
    ['x^2 - 3x + 2', '(x - 1) * (x - 2)'],
    ['x^2 + x - 2', '(x - 1) * (x + 2)'],
    ['-x^2 - 3x - 2', '-(x + 1) * (x + 2)'],
    ['2x^2 + 5x + 3','(x + 1) * (2x + 3)'],
    ['2x^2 - 5x - 3','(2x + 1) * (x - 3)'],
    ['2x^2 - 5x + 3','(x - 1) * (2x - 3)'],
    // TODO: quadratic equation
    ['x^2 + 4x + 1', 'x^2 + 4x + 1'],
    ['x^2 - 3x + 1', 'x^2 - 3x + 1'],
  ];
  tests.forEach(t => testFactorQuadratic(t[0], t[1]));
});

function testFactorSumProductRuleSubsteps(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  TestUtil.testSubsteps(factorQuadratic, exprString, outputList, lastString);
}

describe('factorSumProductRule', function() {
  const tests = [
    // sum product rule
    ['x^2 + 3x + 2',
      ['x^2 + x + 2x + 2',
        '(x^2 + x) + (2x + 2)',
        'x * (x + 1) + (2x + 2)',
        'x * (x + 1) + 2 * (x + 1)',
        '(x + 1) * (x + 2)']
    ],
    ['x^2 - 3x + 2',
      ['x^2 - x - 2x + 2',
        '(x^2 - x) + (-2x + 2)',
        'x * (x - 1) + (-2x + 2)',
        'x * (x - 1) - 2 * (x - 1)',
        '(x - 1) * (x - 2)']
    ],
    ['x^2 + x - 2',
      ['x^2 - x + 2x - 2',
        '(x^2 - x) + (2x - 2)',
        'x * (x - 1) + (2x - 2)',
        'x * (x - 1) + 2 * (x - 1)',
        '(x - 1) * (x + 2)']
    ],
    ['-x^2 - 3x - 2',
      ['-(x^2 + 3x + 2)',
        '-(x^2 + x + 2x + 2)',
        '-((x^2 + x) + (2x + 2))',
        '-(x * (x + 1) + (2x + 2))',
        '-(x * (x + 1) + 2 * (x + 1))',
        '-(x + 1) * (x + 2)']
    ],
    ['2x^2 + 5x + 3',
      ['2x^2 + 2x + 3x + 3',
        '(2x^2 + 2x) + (3x + 3)',
        '2x * (x + 1) + (3x + 3)',
        '2x * (x + 1) + 3 * (x + 1)',
        '(x + 1) * (2x + 3)']
    ],
    ['2x^2 - 5x - 3',
      ['2x^2 + x - 6x - 3',
        '(2x^2 + x) + (-6x - 3)',
        'x * (2x + 1) + (-6x - 3)',
        'x * (2x + 1) - 3 * (2x + 1)',
        '(2x + 1) * (x - 3)']
    ],
    ['2x^2 - 5x + 3',
      ['2x^2 - 2x - 3x + 3',
        '(2x^2 - 2x) + (-3x + 3)',
        '2x * (x - 1) + (-3x + 3)',
        '2x * (x - 1) - 3 * (x - 1)',
        '(x - 1) * (2x - 3)']
    ],
  ];
  tests.forEach(t => testFactorSumProductRuleSubsteps(t[0], t[1]));
});
