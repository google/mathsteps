const collectAndCombineSearch = require('../../../lib/simplifyExpression/collectAndCombineSearch');

const TestUtil = require('../../TestUtil');

function testCollectAndCombineSubsteps(exprString, outputList, outputStr) {
  TestUtil.testSubsteps(collectAndCombineSearch, exprString, outputList, outputStr);
}

function testSimpleCollectAndCombineSearch(exprString, outputStr) {
  TestUtil.testSimplification(collectAndCombineSearch, exprString, outputStr);
}

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

describe('combinePolynomialPowerTerms division', function() {
  const tests = [
    ['x^2 / x',
      ['x^2 / (x^1)',
        'x^(2 - 1)',
        'x^1'],
    ],
    ['y / y^3',
      ['y^1 / (y^3)',
        'y^(1 - 3)',
        'y^-2'],
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
    ['2x + 4x + x', '7x'],
    ['x * x^2 * x', 'x^4']
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

describe('collect and divide multiply like terms', function() {
  const tests = [
    ['10^5 / 10^2', '10^3'],
    ['2^4 / 2^2', '2^2'],
    ['2^3 / 2^4', '2^-1'],
    ['x^3 / x^4', 'x^-1'],
    ['y^5 / y^2', 'y^3'],
    ['z^4 / z^2', 'z^2'],
  ];
  tests.forEach(t => testSimpleCollectAndCombineSearch(t[0], t[1]));
});
