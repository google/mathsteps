const distributeSearch = require('../../../lib/simplifyExpression/distributeSearch');

const TestUtil = require('../../TestUtil');

function testDistribute(exprStr, outputStr) {
  TestUtil.testSimplification(distributeSearch, exprStr, outputStr);
}

describe('distribute - into paren with addition', function () {
  const tests = [
    ['-(x+3)', '(-x - 3)'],
    ['-(x - 3)', '(-x + 3)'],
    ['-(-x^2 + 3y^6)' , '(x^2 - 3y^6)'],
  ];
  tests.forEach(t => testDistribute(t[0], t[1]));
});

describe('distribute - into paren with multiplication/division', function () {
  const tests = [
    ['-(x*3)', '(-x * 3)'],
    ['-(-x * 3)', '(x * 3)'],
    ['-(-x^2 * 3y^6)', '(x^2 * 3y^6)'],
  ];
  tests.forEach(t => testDistribute(t[0], t[1]));
});

function testDistributeSteps(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  TestUtil.testSubsteps(distributeSearch, exprString, outputList, lastString);
}

describe('distribute', function () {
  const tests = [
    ['x*(x+2+y)',
      ['(x * x + x * 2 + x * y)',
        '(x^2 + 2x + x * y)']
    ],
    ['(x+2+y)*x*7',
      ['(x * x + 2x + y * x) * 7',
        '(x^2 + 2x + y * x) * 7']
    ],
    ['(5+x)*(x+3)',
      ['(5 * (x + 3) + x * (x + 3))',
        '((5x + 15) + (x^2 + 3x))']
    ],
    ['-2x^2 * (3x - 4)',
      ['(-2x^2 * 3x - 2x^2 * -4)',
        '(-6x^3 + 8x^2)']
    ],
  ];
  tests.forEach(t => testDistributeSteps(t[0], t[1]));
});

describe('distribute with fractions', function () {
  const tests = [
    // distribute the non-fraction term into the numerator(s)
    ['(3 / x^2 + x / (x^2 + 3)) * (x^2 + 3)',
      '((3 * (x^2 + 3)) / (x^2) + (x * (x^2 + 3)) / (x^2 + 3))',
    ],

    // if both groupings have fraction, the rule does not apply
    ['(3 / x^2 + x / (x^2 + 3)) * (5 / x + x^5)',
      '((3 / (x^2) * 5 / x + 3 / (x^2) * x^5) + (x / (x^2 + 3) * 5 / x + x / (x^2 + 3) * x^5))',
    ],
  ];

  const multiStepTests = [

    ['(2 / x +  3x^2) * (x^3 + 1)',
      ['((2 * (x^3 + 1)) / x + 3x^2 * (x^3 + 1))',
        '((2 * (x^3 + 1)) / x + (3x^5 + 3x^2))']
    ],

    ['(2x + x^2) * (1 / (x^2 -4) + 4x^2)',
      ['((1 * (2x + x^2)) / (x^2 - 4) + 4x^2 * (2x + x^2))',
        '((1 * (2x + x^2)) / (x^2 - 4) + (8x^3 + 4x^4))']
    ],

    ['(2x + x^2) * (3x^2 / (x^2 -4) + 4x^2)',
      ['((3x^2 * (2x + x^2)) / (x^2 - 4) + 4x^2 * (2x + x^2))',
        '((3x^2 * (2x + x^2)) / (x^2 - 4) + (8x^3 + 4x^4))']
    ],

  ];

  tests.forEach(t => testDistribute(t[0], t[1]));

  multiStepTests.forEach(t => testDistributeSteps(t[0], t[1]));
});

describe('expand base', function () {
  const tests = [
    ['(nthRoot(x, 2))^2','nthRoot(x, 2) * nthRoot(x, 2)'],
    ['(nthRoot(x, 2))^3','nthRoot(x, 2) * nthRoot(x, 2) * nthRoot(x, 2)'],
    ['3 * (nthRoot(x, 2))^4', '3 * nthRoot(x, 2) * nthRoot(x, 2) * nthRoot(x, 2) * nthRoot(x, 2)'],
    ['(nthRoot(x, 2) + nthRoot(x, 3))^2', '(nthRoot(x, 2) + nthRoot(x, 3)) * (nthRoot(x, 2) + nthRoot(x, 3))'],
    ['(2x + 3)^2', '(2x + 3) * (2x + 3)'],
    ['(x + 3 + 4)^2', '(x + 3 + 4) * (x + 3 + 4)'],
    // These should not expand
    // Needs to have a positive integer exponent > 1
    ['x + 2', 'x + 2'],
    ['(x + 2)^-1', '(x + 2)^-1'],
    ['(x + 1)^x', '(x + 1)^x'],
    ['(x + 1)^(2x)', '(x + 1)^(2x)'],
    ['(x + 1)^(1/2)', '(x + 1)^(1/2)'],
    ['(x + 1)^2.5', '(x + 1)^2.5'],
  ];

  tests.forEach(t => testDistribute(t[0], t[1]));
});
