const mathsteps = require('./index');

const steps = mathsteps.solveEquation('x + 3 = 4');

// steps.forEach(step => {
//     console.log("before change: " + step.oldNode);         // before change: 2 x + 2 x + x + x
//     console.log("change: " + step.changeType);             // change: ADD_POLYNOMIAL_TERMS
//     console.log("after change: " + step.newNode);          // after change: 6 x
//     console.log("# of substeps: " + step.substeps.length); // # of substeps: 3
// });
