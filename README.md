## A step by step solver for math

[![Join the chat at https://gitter.im/mathsteps-chat/Lobby](https://badges.gitter.im/mathsteps-chat/Lobby.svg)](https://gitter.im/mathsteps-chat/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/socraticorg/mathsteps.svg?branch=master)](https://travis-ci.org/socraticorg/mathsteps)

https://www.youtube.com/watch?v=iCrargw1rrM

## Requirements

Mathsteps requires Node version > 6.0.0

## Usage

To install mathsteps using npm:

    npm install mathsteps

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

(if you're using mathsteps v0.1.6 or lower, use `.print()` instead of `.ascii()`)

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
