## A step by step solver for math

https://www.youtube.com/watch?v=iCrargw1rrM

## Usage

To install mathsteps using npm:

    npm install mathsteps

```js
const mathsteps = require('mathsteps');

const steps = mathsteps.simplifyExpression('2x + 2x + x + x');

steps.forEach(step => {
	console.log("before change: " + step.oldNode);         // before change: 2 x + 2 x + x + x
	console.log("change: " + step.changeType);             // change: ADD_POLYNOMIAL_TERMS
	console.log("after change: " + step.newNode);          // after change: 6 x
	console.log("# of substeps: " + step.substeps.length); // # of substeps: 3
});
```

To solve an equation:
```js
const steps = mathsteps.solveEquation('2x + 2x + x + x');
```

To see all the change types:
```js
const changes = mathsteps.ChangeTypes;
```



## Contributing

Hi! If you're interested in working on this, that would be super awesome!
Learn more here: [CONTRIBUTING.md](CONTRIBUTING.md).

## Build

First clone the project from github:

    git clone https://github.com/socraticorg/mathsteps.git
    cd mathsteps

Install the project dependencies:

    npm install

## Test

To execute tests for the library, install the project dependencies once:

    npm install

Then, the tests can be executed:

    npm test
