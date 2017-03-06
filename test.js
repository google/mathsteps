const mathsteps = require('./index');
const print = require('./lib/util/print');
const parse = require('./lib/util/parse');
const checks = require('./lib/checks');
const flatten = require('./lib/util/flattenOperands');
const math = require('mathjs');

// const steps = mathsteps.simplifyExpression('(5+x)*(x+3)');

// steps.forEach(step => {
//   console.log(`${step.changeType}: ${print(step.newNode)}`);
//   step.substeps.forEach(substep => {
//     console.log(`    ${substep.changeType}: ${print(substep.newNode)}`);
//   });
// });

const steps = mathsteps.solveEquation('x + 3 = 4');

steps.forEach(step => {
  console.log(step.newEquation);
});
