const simplifyExpression = require('../../../lib/simplifyExpression');

const scope = {
  x: 10,
  foo: 20,
  bar: 'foo + x',
  baz: 'bar^2'
};

simplifyExpression('2x + bar', false, scope);