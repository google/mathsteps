# Mathsteps
[![Join the chat at https://gitter.im/mathsteps-chat/Lobby](https://badges.gitter.im/mathsteps-chat/Lobby.svg)](https://gitter.im/mathsteps-chat/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Build Status](https://travis-ci.org/socraticorg/mathsteps.svg?branch=master)](https://travis-ci.org/socraticorg/mathsteps)

Mathsteps is a step-by-step math solver. It helps in solving equations, simplifying an expression and factoring a polynomial. (more to come 😄)

**Solve an equation**

```javascript
const steps = mathsteps.solveEquation('2x + 3x = 35');
```

**See all the change types**
```javascript
const changes = mathsteps.ChangeTypes;
```
Learn [how to use mathsteps](https://github.com/socraticorg/mathsteps/wiki/How-to-use-mathsteps) and [how the codebase works](https://github.com/socraticorg/mathsteps/wiki/Mathsteps-organization).

## Examples
Here is an example to get you started.

```javascript
const mathsteps = require('mathsteps');

const steps = mathsteps.simplifyExpression('2x + 2x + x + x');

steps.forEach(step => {
  console.log("before change: " + step.oldNode);        
  console.log("change: " + step.changeType);             
  console.log("after change: " + step.newNode);          
  console.log("no of substeps: " + step.substeps.length); 
	console.log("before change: " + step.oldNode.toString());   // before change: 2 x + 2 x + x + x
	console.log("change: " + step.changeType);                  // change: ADD_POLYNOMIAL_TERMS
	console.log("after change: " + step.newNode.toString());    // after change: 6 x
	console.log("# of substeps: " + step.substeps.length);      // # of substeps: 3
});

/* 
before change: 2 x + 2 x + x + x
change: ADD_POLYNOMIAL_TERMS
after change: 6 x
no of substeps: 3
*/
```
In this example we have an equation `2x + 2x + x + x` that is being simplified by the method `simplifyExpression`. It returns the output which tells about the equation before and after applying the change, what change was applied and the no of substeps.

## Installation
Mathsteps is available as the `mathsteps` package on [npm](https://www.npmjs.com/package/mathsteps). 
```
npm install mathsteps --save
```

## Contributing
The main objective of the mathsteps is to continue to evolve and provide more operations and features. Read below to learn how can you contribute to the project.

**Contributing guide**

Read our [contributing guide](CONTRIBUTING.md) to suggest more features, report bugs or contribute code.

## Test
```
npm test
```

## License 
Apache-2.0

