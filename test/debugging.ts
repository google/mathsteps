// import assert = require("assert");
//
// import {solveEquation} from '../lib/src/solveEquation';
//
// const NO_STEPS = "no-steps";
//
// function testSolve(equationString, outputStr, debug = true) {
//
//   if (debug === true) {
//     console.log('=======testing =========', equationString)
//   }
//
//   const steps = solveEquation(equationString, debug);
//   let lastStep;
//   if (steps.length === 0) {
//     lastStep = NO_STEPS;
//   } else {
//     lastStep = steps[steps.length - 1].newEquation.ascii();
//   }
//   it(equationString + " -> " + outputStr, (done) => {
//     assert.equal(lastStep, outputStr);
//     done();
//   });
// }
//
//
// describe('test for debugging', () => {
//
//   console.log('here?!')
//
//   testSolve("5x/2 + 2 = 3x/2 + 10", "x = 8")
// })
