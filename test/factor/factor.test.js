const assert = require('assert');
const factor = require('../../lib/factor');
const print = require('../../lib/util/print');

const NO_STEPS = 'no-steps';

function testFactor(expressionString, outputStr, debug=false) {
  const steps = factor(expressionString, debug);
  let lastStep;
  if (steps.length === 0) {
    lastStep = NO_STEPS;
  }
  else {
    lastStep = print.ascii(steps[steps.length -1].newNode);
  }
  it(expressionString + ' -> ' + outputStr, (done) => {
    assert.equal(lastStep, outputStr);
    done();
  });
}

describe('factor expressions', function () {
  const tests = [
    ['x^2', NO_STEPS],
    ['x^2 + 2x', 'x * (x + 2)'],
    ['x^2 - 4', '(x + 2) * (x - 2)'],
    ['x^2 + 4', NO_STEPS],
    ['x^2 + 2x + 1', '(x + 1)^2'],
    ['x^2 + 3x + 2', '(x + 1) * (x + 2)'],
    ['x^3 + x^2 + x + 1', NO_STEPS],
    ['1 + 2', NO_STEPS],
    ['x + 2', NO_STEPS],
  ];
  tests.forEach(t => testFactor(t[0], t[1], t[2]));
});

