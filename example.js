const solveEquation = require('./lib/solveEquation');

const scope = {
  baz: '(bar^2)',
  x: 10,
  bar: '(foo + x)',
  foo: 20,
};

const steps = solveEquation('2y = baz - x^2', false, scope);

steps.forEach(step => {
  // eslint-disable-next-line
  console.log('before change: ' + step.oldEquation.print());   // before change: 2 x + 2 x + x + x
  // eslint-disable-next-line
  console.log('change: ' + step.changeType);                  // change: ADD_POLYNOMIAL_TERMS
  // eslint-disable-next-line
  console.log('after change: ' + step.newEquation.print());    // after change: 6 x
  // eslint-disable-next-line
  console.log('# of substeps: ' + step.substeps.length + '\n');      // # of substeps: 3
});