const mathsteps = require('./index');
const print = require('./lib/util/print');
const parse = require('./lib/util/parse');
const checks = require('./lib/checks');
const flatten = require('./lib/util/flattenOperands');
const math = require('mathjs');

// const ast = parse('2(x+3)/3 = 2');
// console.log(JSON.stringify(ast, null, 2));

// const steps = mathsteps.simplifyExpression('4/5 - 4/5');

const steps = mathsteps.solveEquation('2(x+3)/3 = 2');

const logStep = (step, level = 0) => {
  const indent = ' '.repeat(4 * level);
  console.log(`${indent}${step.changeType}: ${print(step.newEquation.leftNode)} = ${print(step.newEquation.rightNode)}`);
  step.substeps.forEach(substep => logStep(substep, level + 1));
};

steps.forEach(step => logStep(step));
