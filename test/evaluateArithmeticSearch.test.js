'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/util/flattenOperands');
const print = require('./../lib/util/print');
const evaluateArithmeticSearch = require('../lib/evaluateArithmeticSearch');

function testArithmetic(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(evaluateArithmeticSearch(flatten(math.parse(exprStr))).newNode),
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
