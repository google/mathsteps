'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const print = require('./../lib/print');
const stepper = require('../lib/simplifyExpression');
const simplifyOperations = require('../lib/simplifyOperations');
const stepThrough = stepper.stepThrough;

function testSimplify(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplifyOperations(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('simplifies', function () {
  const tests = [
    // abs
    ['abs(4)', '4'],
    ['abs(-5)', '5'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));
});
