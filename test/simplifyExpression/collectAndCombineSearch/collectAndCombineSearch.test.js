const collectAndCombineSearch = require('../../../lib/simplifyExpression/collectAndCombineSearch');

const TestUtil = require('../../TestUtil');

function testCollectAndCombineSubsteps(exprString, outputList, outputStr) {
  TestUtil.testSubsteps(collectAndCombineSearch, exprString, outputList, outputStr);
}

function testSimpleCollectAndCombineSearch(exprString, outputStr) {
  TestUtil.testSimplification(collectAndCombineSearch, exprString, outputStr);
}


describe.skip('collect like terms', function() {
  const tests = [
    ['2x + 1 - 2x', '(2 x - 2 x) + 1'],
    ['2x + 1 - x', '(2 x - x) + 1'],
    ['x^2 + 1 + x^2', '(x^2 + x^2) + 1'],
    ['x^y + 1 + x^y', '(x^y + x^y) + 1'],
    ['3 x y + 1 - 2 x y', '(3 x y - 2 x y) + 1'],
    ['x y + 1 + y x', '(x y + x y) + 1'],
    ['x y + 1 + 3 y x', '(x y + 3 x y) + 1'],
    ['x^2 + 2x^2 - 3x^3 - 4x^3', '(x^2 + 2 x^2) + (-3 x^3 - 4 x^3)'],
    ['2x + 7y + 5 + 3y + 9x + 11', '(2 x + 9 x) + (7 y + 3 y) + (5 + 11)'],
    ['2x + 4x', '2 x + 4 x'],
  ]
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]))
})

describe.skip('multiplyPolynomialTerms', function() {
  const tests = [
    ['x^2 * x * x', 'x^4'],
    ['x^2 * x^1', 'x^3'],
    ['x^3 * y^2', 'x^3 y^2'],
    ['x^3 + x^1 + x^1 * x^1 * y^3', 'x^3 + x^1 + x^2 y^3'],
    ['x^1 * x^1 * (x+1)^2 * (x+1)^3', 'x^2 (x + 1)^5'],
    ['x^1 * x^3 * (2x+4)^2', 'x^4 (2 x + 3)^2'],
  ]
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]))
})

describe.skip('addPolynomialTerms', function() {
  const tests = [
    ['2x + 2x + 2 + 4', '4 x + (2 + 4)'],
    ['2x + 2x + 2', '4 x + 2'],
    ['3y^2 - 2y^2 + y^4', '1 y^2 + y^4'],
    ['x - x', '0 x'],
    ['2x + 3x + 2y + 3y', '5 x + 5 y'],
    ['-2y + 3y', '1 y'],
    ['3 xy + 2 xy', '5 xy'],
    ['3 xy - 2 xy + x^2y^2', 'x^2 y^2 + 1 xy'],
    ['2 x y + 2 y x', '4 x y'],
    ['2x + 4x', '6 x'],
  ]
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]))
})

describe.skip('collect and combine with no substeps', function() {
  const tests = [
    ['2x + 1 - 2x', '0 x + 1'],
    ['2x + 1 - x', '1 x + 1'],
    ['x^2 + 1 + x^2', '2 x^2 + 1'],
    ['x^y + 1 + x^y', '2 x^y + 1'],
    ['3 x y + 1 - 2 x y', '1 x y + 1'],
    ['x y + 1 + y x', '2 x y + 1'],
    ['x y + 1 + 3 y x', '4 x y + 1'],
    ['x^2 + 2x^2 - 3x^3 - 4x^3', '3 x^2 + -7 x^3'],
    ['2x + 7y + 5 + 3y + 9x + 11', '11 x + 10 y + (5 + 11)'],
  ]
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]))
})

describe.skip('combinePolynomialTerms multiplication', function() {
  const tests = [
    /*
    ['x^2 * x * x',
      ['x^2 * x^1 * x^1',
        'x^(2 + 1 + 1)',
        'x^4'],
    ],*/
    /*
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
    */
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1], t[2]));
});

describe.skip('combinePolynomialTerms addition', function() {
  const tests = [
    ['2x + 4x + y',
      ['(2 x + 4 x) + y',
        '6 x + y']
    ],
    ['3y + 2x + 3y + 4x + 3',
     ['(2 x + 4 x) + (3 y + 3 y) + 3',
      '6 x + (3 y + 3 y) + 3',
      '6 x + 6 y + 3']
    ]
  ];
  tests.forEach(t => testCollectAndCombineSubsteps(t[0], t[1]));
});

describe.skip('combineConstantPowerTerms multiplication', function() {
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

describe.skip('collect and multiply like terms', function() {
  const tests = [
    ['10^3 * 10^2', '10^5'],
    ['2^4 * 2 * 2^4 * 2', '2^10']
  ];
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]));
});

