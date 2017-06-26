const arithmeticSearch = require('../../../lib/simplifyExpression/arithmeticSearch');

const TestUtil = require('../../TestUtil');

describe('evaluate arithmeticSearch', function () {
  const tests = [
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['9/4', '9 / 4'], //  does not divide
    ['1 + 2', '3'],
    ['1 + 2 + 3', '6'],
    ['3 * 8', '24'],
    ['-2^2', '-4'],
    ['(-2)^2', '4'],
    ['1 + 2 + y', '3 + y'],
  ];
  tests.forEach(t => TestUtil.testSimplification(arithmeticSearch, t[0], t[1]));
});
