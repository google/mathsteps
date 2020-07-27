const distributeSearch = require('../../../lib/simplifyExpression/distributeSearch')

const TestUtil = require('../../TestUtil')

function testDistribute(exprStr, outputStr) {
  TestUtil.testSimplification(distributeSearch, exprStr, outputStr)
}

describe('distribute - into paren with addition', function () {
  const tests = [
    ['-(x+3)', '(-x - 3)'],
    ['-(x - 3)', '(-x + 3)'],
    ['-(-x^2 + 3y^6)' , '(x^2 - 3y^6)'],
  ]
  tests.forEach(t => testDistribute(t[0], t[1]))
})

describe('distribute - into paren with multiplication/division', function () {
  const tests = [
    ['-(x*3)', '(-x * 3)'],
    ['-(-x * 3)', '(x * 3)'],
    ['-(-x^2 * 3y^6)', '(x^2 * 3y^6)'],
  ]
  tests.forEach(t => testDistribute(t[0], t[1]))
})

function testDistributeSteps(exprString, outputList) {
  const lastString = outputList[outputList.length - 1]
  TestUtil.testSubsteps(distributeSearch, exprString, outputList, lastString)
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

    // 2 cases from al_foil
    ['(x - 2)^2',
      ['(x - 2) * (x - 2)',
        '(x * (x - 2) - 2 * (x - 2))',
        '((x^2 - 2x) + (-2x + 4))',
      ]
    ],
    ['(3x + 5)^2',
      ['(3x + 5) * (3x + 5)',
        '(3x * (3x + 5) + 5 * (3x + 5))',
        '((3^2 * x^2 + 15x) + (15x + 25))'
      ]
    ]
  ]
  tests.forEach(t => testDistributeSteps(t[0], t[1]))
})

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
  ]

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

  ]

  tests.forEach(t => testDistribute(t[0], t[1]))

  multiStepTests.forEach(t => testDistributeSteps(t[0], t[1]))
})

describe('expand base', function () {
  const tests = [
    // One case from al_distribute_over_mult
    ['(nthRoot(x, 2))^4', 'x^(1/2 * 4)'],

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

    // One case from al_distribute_over_mult
    ['1 / (x + 1)^x', '1 / ((x + 1)^x)']
  ]

  tests.forEach(t => testDistribute(t[0], t[1]))
})

describe('distribute negative exponent', function () {
  const tests = [
    ['(x y)^-1', '1 / ((x * y)^1)'],
    ['(x y)^-x', '1 / ((x * y)^x)'],
    ['(x y)^(-2x^2)','1 / ((x * y)^(2x^2))'],
    ['(x y)^(-(x + 1))', '1 / ((x * y)^((x + 1)))'],
  ]

  tests.forEach(t => testDistribute(t[0], t[1]))
})

describe('distribute exponent', function () {
  const tests = [
    // When terms are polynomialTerms
    ['(x^2 y^2)^2', 'x^(2 * 2) * y^(2 * 2)',],
    ['(x y)^2', 'x^2 * y^2'],
    ['(x y z)^2', 'x^2 * y^2 * z^2'],
    ['(x^2 y z^2)^2', 'x^(2 * 2) * y^2 * z^(2 * 2)'],
    ['(x^2)^2', 'x^(2 * 2)'],
    // When terms have coefficients
    ['(2x y)^2', '2^2 * x^2 * y^2'],
    ['(2x^2 * 3y^2)^2', '2^2 * x^(2 * 2) * 3^2 * y^(2 * 2)'],
    ['(x^2 * 3x * y^2)^3', 'x^(2 * 3) * 3^3 * x^3 * y^(2 * 3)'],
    // When terms are polynomials or power nodes
    ['((x + 1)^2 (x + 1)^2)^2', '(x + 1)^(2 * 2) * (x + 1)^(2 * 2)'],
    ['((x + y)^3 * (x + 1))^3', '(x + y)^(3 * 3) * (x + 1)^3'],
    ['((x + 1) (y + 1) (z + 1))^2', '(x + 1)^2 * (y + 1)^2 * (z + 1)^2'],
    // When terms are division nodes
    ['(x/y)^2', 'x^2 / (y^2)'],
    ['(2/3)^2', '2^2 / (3^2)'],
    ['(-5/6)^2', '-5^2 / (6^2)'],
    ['((-5x)/7)^3', '(-5x)^3 / (7^3)'],
    ['((2x)/y)^3', '(2x)^3 / (y^3)'],
    ['((4x)/(5y))^3', '(4x)^3 / ((5y)^3)'],
    // Combination of terms
    ['(2x * (x + 1))^2', '2^2 * x^2 * (x + 1)^2'],
    ['((x + 1) * 2y^2 * 2)^2', '(x + 1)^2 * 2^2 * y^(2 * 2) * 2^2'],
    // Works for decimal exponents too
    ['(x^2 y)^2.5', 'x^(2 * 2.5) * y^2.5'],
    ['((x + 1) x^2)^2.2', '(x + 1)^2.2 * x^(2 * 2.2)'],
    // Convert nthRoot to exponent form
    ['nthRoot(x, 2)^3', 'x^(1/2 * 3)'],
    ['nthRoot(x, 2)^2', 'x^1'],
    ['nthRoot(x, 3)^2', 'x^(1/3 * 2)'],
    ['nthRoot(x^2, 2)^(1/2)', 'x^2^(1/2 * 1/2)'],
    // Multiplying nthRoots
    ['(nthRoot(x, 2) * nthRoot(x, 3))^2', 'nthRoot(x, 2)^2 * nthRoot(x, 3)^2'],
    ['(nthRoot(x, 2)^2 * nthRoot(x, 2))^2', 'nthRoot(x, 2)^(2 * 2) * nthRoot(x, 2)^2'],
    // Does not change
    ['2^2', '2^2'],
    ['x^2', 'x^2'],
    ['x', 'x'],
  ]

  tests.forEach(t => testDistribute(t[0], t[1]))
})
