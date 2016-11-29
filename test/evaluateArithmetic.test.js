'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const print = require('./../lib/print');
const evaluateArithmetic = require('../lib/evaluateArithmetic');

function testArithmetic(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(evaluateArithmetic(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}
describe('evaluate arithmetic', function () {
  const tests = [
    ['2+2', '4'],
    ['2*3*5', '30'],
    ['9/4', '9/4'], //  does not divide
  ];
  tests.forEach(t => testArithmetic(t[0], t[1]));
});
