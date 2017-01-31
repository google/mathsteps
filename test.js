const mathsteps = require('./index');

const steps = mathsteps.solveEquation('x - 3.4 = ( x - 2.5)/( 1.3)');

steps.forEach(step => {
    // console.log("before change: " + step.oldEquation);     // before change: 2 x + 2 x + x + x
    // console.log("change: " + step.changeType);             // change: ADD_POLYNOMIAL_TERMS
    // console.log("after change: " + step.newEquation);      // after change: 6 x
    // console.log("# of substeps: " + step.substeps.length); // # of substeps: 3
    console.log(step.newEquation.print());
});
