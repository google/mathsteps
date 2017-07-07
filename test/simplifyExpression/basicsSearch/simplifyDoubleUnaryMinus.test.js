const simplifyDoubleUnaryMinus = require('../../../lib/simplifyExpression/basicsSearch/simplifyDoubleUnaryMinus');

const testSimplify = require('./testSimplify');


describe.skip('simplifyDoubleUnaryMinus', function() {
  var tests = [
      ['--5', '5'],
      ['--x', 'x']
  ];
  tests.forEach(t => testSimplify(t[0], t[1], simplifyDoubleUnaryMinus));
});
