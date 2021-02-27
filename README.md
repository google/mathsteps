## Work in progress

This is work in progress and not ready to be used.

What has been achieved so far:
- Porting https://github.com/google/mathsteps to TypeScript!

## Why Mathsteps
Mathsteps aims to provide step-by-step instructions like a tutor would give them to a student.

## Requirements

Mathsteps requires Node version > 6.0.0

## Usage Example

To install mathsteps using npm:

   (Coming)

    npm install @taskbase/mathsteps

```js
const mathsteps = require('mathsteps');

const steps = mathsteps.simplifyExpression('2x + 2x + x + x');

steps.forEach(step => {
	console.log("before change: " + step.oldNode.toString());   // before change: 2 x + 2 x + x + x
	console.log("change: " + step.changeType);                  // change: ADD_POLYNOMIAL_TERMS
	console.log("after change: " + step.newNode.toString());    // after change: 6 x
	console.log("# of substeps: " + step.substeps.length);      // # of substeps: 3
});
```

To solve an equation:
```js
const steps = mathsteps.solveEquation('2x + 3x = 35');

steps.forEach(step => {
    console.log("before change: " + step.oldEquation.ascii());  // e.g. before change: 2x + 3x = 35
    console.log("change: " + step.changeType);                  // e.g. change: SIMPLIFY_LEFT_SIDE
    console.log("after change: " + step.newEquation.ascii());   // e.g. after change: 5x = 35
    console.log("# of substeps: " + step.substeps.length);      // e.g. # of substeps: 2
});
```

To see all the change types:
```js
const changes = mathsteps.ChangeTypes;
```

## Which syntax is mathsteps expecting?

[Asciimath](http://asciimath.org/)





## Simplify Expression
Simplifying Expressions

### What can mathsteps simplifyExpression do?
- arithmetic simplification: `["(2+2)*5", "20"]`
- collect and combines like terms: `["x^2 + 3x*(-4x) + 5x^3 + 3x^2 + 6", "5x^3 - 8x^2 + 6"]`
- simplify with division: `["(20 * x) / (5 * (40 * y))", "x / (10y)"]`
- deal with fractions: `["2(x+3)/3", "2x / 3 + 2"]`
- cancelling out: `["(1+2a)/a", "1 / a + 2"]`
- deal with absolute values: `["(x^3*y)/x^2 + abs(-5)", "x * y + 5"]`
- deal with nth roots: `["x * nthRoot(x^4, 2)", "x^3"]`

unsure:
- deal with higher order polynomials: ?

### What can't mathsteps simplifyExpression do?
- 


## Solve Equation
Solving equations.

### What can solveEquation do?
- Solve linear equations with one variable
- Solve for y in linear equations with x and y as variables.
- Solve binomic equation
- Some inequalities (e.g. "x + 2 > 3" to "x > 1")
- Constant comparison (e.g. "1 = 2" to ChangeTypes.STATEMENT_IS_FALSE)

### What can't solveEquation do?
- Expressions with multiple variables other than y and x
- Some inequalities (e.g. "( x )/( 2x + 7) >= 4")
- Calculate square root of x^2, so result will stay e.g. x^2=2


## Build

First clone the project from github:

```
git clone https://github.com/taskbase/mathsteps.git
cd mathsteps
```

Install the project dependencies:

```
npm ci
```

## Test

To execute tests for the library, install the project dependencies:

```
npm ci
```

Then, the tests can be executed:

```
npm test
```

## Attribution
Based on google/mathsteps
