const cancelLikeTerms = require('../../../lib/simplifyExpression/fractionsSearch/cancelLikeTerms')

const TestUtil = require('../../TestUtil')

function testCancelLikeTerms(exprStr, expectedStr) {
  TestUtil.testSimplification(cancelLikeTerms, exprStr, expectedStr)
}

describe('cancel like terms', function () {
  const tests = [
    ['2/2', '1'],
    ['x^2/x^2', '1'],
    ['x^3/x^2', 'x^(3 - (2))'], // parens will be removed at end of step
    ['(x^3*y)/x^2', 'x^(3 - (2)) * y'],
    ['-(7+x)^8/(7+x)^2', '-(7 + x)^(8 - (2))'],
    // TODO: this isn't cancelling because 2x^2 != 2*x^2
    // which is weird cause idk where the * is coming from (maybe flatten?)
    // but also cancelling should be updated to deal with that case
    ['(2x^2 * 5) / (2x^2)', '5'], // these parens have to stay around 2x^2 to be parsed correctly - hopefully the parsing coefficient change fixes that
    ['(x^2 * y) / x', 'x^(2 - (1)) * y'],
    ['(2x^2) / (2x^2 * 5)', '1/5'], // TODO(math-parser) temporary parens
    ['x / (x^2*y)', 'x^(1 - (2)) / y'],
    ['(4x^2) / (5x^2)', '4/5'],
    ['(2x+5)^8 / (2x+5)^2', '(2x + 5)^(8 - (2))'],
    ['(4x^3) / (5x^2)', '(4 x^(3 - (2))) / 5'],
    ['-x / -x', '1'],
    ['2/ (4x)', '1 / (2x)'],
    ['2/ (4x^2)', '1 / (2 x^2)'], // TODO(printing) no spaces for coefficients
    ['(2a) / a', '2'],
    ['(35 * nthRoot (7)) / (5 * nthRoot(5, 2))','(7 * nthRoot(7, 2)) / nthRoot(5, 2)'],
    ['3/(9r^2)', '1 / (3 r^2)'], // TODO(printing) no spaces for coefficients
    ['6/(2x)', '3/x']
  ]

  tests.forEach(t => testCancelLikeTerms(t[0], t[1]))
})
