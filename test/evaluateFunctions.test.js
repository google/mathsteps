'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const print = require('./../lib/print');
const evaluateFunctions = require('../lib/evaluateFunctions');

function testEvaluateFunctions(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(evaluateFunctions(flatten(math.parse(exprString))).newNode),
      outputStr);
  });
}

describe('abs', function () {
  const tests = [
    ['abs(4)', '4'],
    ['abs(-5)', '5'],
  ];
  tests.forEach(t => testEvaluateFunctions(t[0], t[1]));
});

// Removing root functionality temporarily
// describe('simplify nthRoot', function () {
//   const tests = [
//     ['nthRoot(4)', '2'],
//     ['nthRoot(8, 3)', '2'],
//     ['nthRoot(5 * 7)', 'nthRoot(5 * 7)'],
//     ['nthRoot(4, 3)', 'nthRoot(4, 3)'],
//     ['nthRoot(12)', '2 * nthRoot(3, 2)'],
//     ['nthRoot(36)', '6'],
//     ['nthRoot(72)', '2 * 3 * nthRoot(2, 2)'],
//     ['nthRoot(x^2)', 'x'],
//     ['nthRoot(x ^ 3)', 'nthRoot(x ^ 3)'],
//     ['nthRoot(x^3, 3)', 'x'],
//     ['nthRoot(-2)', 'nthRoot(-2)'],
//     ['nthRoot(2 ^ x, x)', '2'],
//     ['nthRoot(x ^ (1/2), 1/2)', 'x'],
//     ['nthRoot(2 * 2, 2)', '2'],
//     ['nthRoot(3 * 2 * 3 * 2, 2)', '2 * 3'],
//     ['nthRoot(36*x)', '2 * 3 * nthRoot(x, 2)'],
//     ['nthRoot(2 * 18 * x ^ 2, 2)', '2 * 3 * x'],
//     ['nthRoot(x * x, 2)', 'x'],
//     ['nthRoot(x * x * (2 + 3), 2)', 'x * nthRoot((2 + 3), 2)'],
//   ];
//   tests.forEach(t => testEvaluateFunctions(t[0], t[1]));
// });

// function testEvaluateSteps(exprString, outputList) {
//   const lastString = outputList[outputList.length - 1];
//   it(exprString + ' -> ' + lastString, function () {
//     const status = evaluateFunctions(flatten(math.parse(exprString)));
//     const substeps = status.substeps;

//     assert.deepEqual(substeps.length, outputList.length);
//     substeps.forEach((step, i) => {
//       assert.deepEqual(
//         print(step.newNode),
//         outputList[i]);
//     });

//     assert.deepEqual(
//       print(status.newNode),
//       lastString);
//   });
// }

// describe('nthRoot steps', function () {
//   const tests = [
//     ['nthRoot(12)',
//       ['nthRoot(2 * 2 * 3)',
//         'nthRoot((2 * 2) * 3)',
//         'nthRoot(2 ^ 2 * 3)',
//         'nthRoot(2 ^ 2, 2) * nthRoot(3, 2)',
//         '2 * nthRoot(3, 2)']
//     ],
//     ['nthRoot(72)',
//       ['nthRoot(2 * 2 * 2 * 3 * 3)',
//         'nthRoot((2 * 2) * 2 * (3 * 3))',
//         'nthRoot(2 ^ 2 * 2 * 3 ^ 2)',
//         'nthRoot(2 ^ 2, 2) * nthRoot(2, 2) * nthRoot(3 ^ 2, 2)',
//         '2 * nthRoot(2, 2) * 3',
//         '2 * 3 * nthRoot(2, 2)']
//     ],
//     ['nthRoot(36*x)',
//       ['nthRoot(2 * 2 * 3 * 3 * x)',
//         'nthRoot((2 * 2) * (3 * 3) * x)',
//         'nthRoot(2 ^ 2 * 3 ^ 2 * x)',
//         'nthRoot(2 ^ 2, 2) * nthRoot(3 ^ 2, 2) * nthRoot(x, 2)',
//         '2 * 3 * nthRoot(x, 2)']
//     ],
//     ['nthRoot(2 * 18 * x ^ 2, 2)',
//       ['nthRoot(2 * 2 * 3 * 3 * x ^ 2, 2)',
//         'nthRoot((2 * 2) * (3 * 3) * x ^ 2, 2)',
//         'nthRoot(2 ^ 2 * 3 ^ 2 * x ^ 2, 2)',
//         'nthRoot(2 ^ 2, 2) * nthRoot(3 ^ 2, 2) * nthRoot(x ^ 2, 2)',
//         '2 * 3 * x']
//     ]
//   ];
//   tests.forEach(t => testEvaluateSteps(t[0], t[1]));
// });
