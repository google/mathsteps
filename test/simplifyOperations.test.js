'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands.js');
const print = require('./../lib/print');
const stepper = require('../lib/simplifyExpression.js');
const simplifyOperations = require('../lib/simplifyOperations.js');
const stepThrough = stepper.stepThrough;
const MathChangeTypes = require('../lib/MathChangeTypes');

function testSimplify(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplifyOperations(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('simplifies', function () {
  const tests = [
    //performArithmetic
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['9/4', '9/4'], //  does not divide
    // abs
    ['abs(4)', '4'],
    ['abs(-5)', '5'],
  ];
  tests.forEach(t => testSimplify(t[0], t[1]));

  it('simplifyDoubleUnaryMinus step actually happens: 22 - (-7) -> 22 + 7', function () {
    const steps = stepThrough(math.parse('22 - (-7)'));
    assert.equal(steps[0].explanation, MathChangeTypes.RESOLVE_DOUBLE_UNARY_MINUS);
  });
});
