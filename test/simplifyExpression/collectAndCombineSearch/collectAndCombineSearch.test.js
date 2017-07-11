const collectAndCombineSearch = require('../../../lib/simplifyExpression/collectAndCombineSearch');

const TestUtil = require('../../TestUtil');

function testCollectAndCombineSubsteps(exprString, outputList, outputStr) {
  TestUtil.testSubsteps(collectAndCombineSearch, exprString, outputList, outputStr);
}

function testSimpleCollectAndCombineSearch(exprString, outputStr) {
  TestUtil.testSimplification(collectAndCombineSearch, exprString, outputStr);
}

describe('combineNthRoots multiplication', function() {
  const tests = [
    ['nthRoot(x, 2) * nthRoot(x, 2) * nthRoot(x, 3)',
      ['(nthRoot(x, 2) * nthRoot(x, 2)) * nthRoot(x, 3)',
        'nthRoot(x * x, 2) * nthRoot(x, 3)'],
    ],
    ['nthRoot(x, 2) * nthRoot(x, 2) * nthRoot(x, 3) * 3',
      ['3 * (nthRoot(x, 2) * nthRoot(x, 2)) * nthRoot(x, 3)',
        '3 * nthRoot(x * x, 2) * nthRoot(x, 3)'],
    ],
    ['nthRoot(2x, 2) * nthRoot(2x, 2) * nthRoot(y, 4) * nthRoot(y^3, 4)',
      ['(nthRoot(2 x, 2) * nthRoot(2 x, 2)) * (nthRoot(y, 4) * nthRoot(y ^ 3, 4))',
        'nthRoot(2 x * 2 x, 2) * (nthRoot(y, 4) * nthRoot(y ^ 3, 4))',
        'nthRoot(2 x * 2 x, 2) * nthRoot(y * y ^ 3, 4)'],
    ],
    ['nthRoot(x) * nthRoot(x)',
      [],
      'nthRoot(x * x, 2)'
    ],
    ['nthRoot(3) * nthRoot(3)',
      [],
      'nthRoot(3 * 3, 2)'
    ],
    ['nthRoot(5) * nthRoot(9x, 2)',
      [],
      'nthRoot(5 * 9 x, 2)'
    ]
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1], t[2]));
});

describe('combinePolynomialTerms multiplication', function() {
  const tests = [
    ['x^2 * x * x',
      ['x^2 * x^1 * x^1',
        'x^(2 + 1 + 1)',
        'x^4'],
    ],
    ['y * y^3',
      ['y^1 * y^3',
        'y^(1 + 3)',
        'y^4'],
    ],
    ['2x * x^2 * 5x',
      ['(2 * 5) * (x * x^2 * x)',
        '10 * (x * x^2 * x)',
        '10x^4'],
      '10x^4'
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1], t[2]));
});

describe('combinePolynomialTerms addition', function() {
  const tests = [
    ['x+x',
      ['1x + 1x',
        '(1 + 1) * x',
        '2x']
    ],
    ['4y^2 + 7y^2 + y^2',
      ['4y^2 + 7y^2 + 1y^2',
        '(4 + 7 + 1) * y^2',
        '12y^2']
    ],
    ['2x + 4x + y',
      ['(2x + 4x) + y',
        '6x + y'],
      '6x + y'
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1]));
});

describe('combineNthRootTerms addition', function() {
  const tests = [
    ['nthRoot(x) + nthRoot(x)',
      ['1 * nthRoot(x) + 1 * nthRoot(x)',
        '(1 + 1) * nthRoot(x)',
        '2 * nthRoot(x)']
    ],
    ['4nthRoot(2)^2 + 7nthRoot(2)^2 + nthRoot(2)^2',
      ['4 * nthRoot(2)^2 + 7 * nthRoot(2)^2 + 1 * nthRoot(2)^2',
        '(4 + 7 + 1) * nthRoot(2)^2',
        '12 * nthRoot(2)^2']
    ],
    ['10nthRoot(5y) - 2nthRoot(5y)',
      ['(10 - 2) * nthRoot(5 y)',
        '8 * nthRoot(5 y)'],
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1]));
});

describe('combineConstantPowerTerms multiplication', function() {
  const tests = [
    ['10^2 * 10',
      ['10^2 * 10^1',
        '10^(2 + 1)',
        '10^3'],
    ],
    ['2 * 2^3',
      ['2^1 * 2^3',
        '2^(1 + 3)',
        '2^4'],
    ],
    ['3^3 * 3 * 3',
      ['3^3 * 3^1 * 3^1',
        '3^(3 + 1 + 1)',
        '3^5'],
    ],
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1], t[2]));
});

describe('collectAndCombineSearch with no substeps', function () {
  const tests = [
    ['nthRoot(x, 2) * nthRoot(x, 2)', 'nthRoot(x * x, 2)'],
    ['-nthRoot(x, 2) * nthRoot(x, 2)', '-1 * nthRoot(x * x, 2)'],
    ['-nthRoot(x, 2) * -nthRoot(x, 2)', '1 * nthRoot(x * x, 2)'],
    ['2x + 4x + x', '7x'],
    ['x * x^2 * x', 'x^4'],
    ['3*nthRoot(11) - 2*nthRoot(11)', '1 * nthRoot(11)'],
    ['nthRoot(xy) + 2x + nthRoot(xy) + 5x', '2 * nthRoot(xy) + 7x'],
  ];
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]));
});

describe('collect and multiply like terms', function() {
  const tests = [
    ['10^3 * 10^2', '10^5'],
    ['2^4 * 2 * 2^4 * 2', '2^10']
  ];
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]));
});
