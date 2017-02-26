const mathsteps = require('./index');

// const steps = mathsteps.solveEquation('5x + (1/2)x = 27');

// steps.forEach(step => {
//     console.log("before change: " + step.oldEquation.print());  // before change: 2 x + 2 x + x + x
//     console.log("change: " + step.changeType);                  // change: ADD_POLYNOMIAL_TERMS
//     console.log("after change: " + step.newEquation.print());   // after change: 6 x
//     console.log("# of substeps: " + step.substeps.length);      // # of substeps: 3
// });

const steps = mathsteps.simplifyExpression('abs(-3) / (3)');

steps.forEach(step => {
  console.log(JSON.stringify(step.newNode));
});

