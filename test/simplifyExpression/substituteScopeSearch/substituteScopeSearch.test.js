const solveEquation = require('../../../lib/solveEquation');

const scope = {
  x: 10,
  foo: 20,
  bar: 'foo + x',
  baz: 'bar^2'
};

solveEquation('2x + 3x = 35', false, scope);