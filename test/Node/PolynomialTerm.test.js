const PolynomialTerm = require('../../lib/node/PolynomialTerm');

const TestUtil = require('../TestUtil');

function testIsPolynomialTerm(exprStr, isTerm) {
  TestUtil.testBooleanFunction(PolynomialTerm.isPolynomialTerm, exprStr, isTerm);
}

describe('classifies polynomial terms correctly', function() {
  const tests = [
    ['x', true],
    ['x^2', true],
    ['y^55', true],
    ['y^4/4', true],
    ['x^y', true],
    ['3', false],
    ['2^5', false],
    ['x*y^5', false],
  ];
  tests.forEach(t => testIsPolynomialTerm(t[0], t[1]));
});

// TODO(math-parser or porting): the node structure is different in mathjs
// and math-parser here, which is causing it to not follow the logic for
// a fraction coefficient. We should probably make the mathsteps code more
// flexible to handle both cases
describe.skip('classifies polynomial terms with fraction coefficeientsy', function() {
  const tests = [
    ['5y/3', true],
    ['-12y^5/-3', true],
  ];
  tests.forEach(t => testIsPolynomialTerm(t[0], t[1]));
});
