const mathsteps = require('./index');
const print = require('./lib/util/print');
const parse = require('./lib/util/parse');

const simplifyPolynomialFraction = require('./lib/simplifyExpression/fractionsSearch/simplifyPolynomialFraction');

// const steps = mathsteps.solveEquation('5x + (1/2)x = 27');

// steps.forEach(step => {
//     console.log("before change: " + step.oldEquation.print());  // before change: 2 x + 2 x + x + x
//     console.log("change: " + step.changeType);                  // change: ADD_POLYNOMIAL_TERMS
//     console.log("after change: " + step.newEquation.print());   // after change: 6 x
//     console.log("# of substeps: " + step.substeps.length);      // # of substeps: 3
// });

const ast = parse('2 * x / 4');
const output = simplifyPolynomialFraction(ast);

// console.log(print(ast));
console.log(print(output.newNode));
// console.log(print(output));

// const steps = mathsteps.simplifyExpression('2 * x / 4');

// steps.forEach(step => {
//   console.log("change: " + step.changeType);
//   console.log(print(step.newNode));
// });

// const ast = parse('5 + (3 * 6) + (2 * y / x)');
// const output = print(ast);

// console.log(output);
