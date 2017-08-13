const rearrangeCoefficient = require('../../../lib/simplifyExpression/basicsSearch/rearrangeCoefficient');

const testSimplify = require('./testSimplify');

describe('rearrangeCoefficient', function() {
  const tests = [
    ['y^3 * 5', '5 y^3'], // TODO(printing)
  ];
  tests.forEach(t => testSimplify(t[0], t[1], rearrangeCoefficient));
});
