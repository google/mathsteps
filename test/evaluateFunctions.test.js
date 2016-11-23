'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/flattenOperands');
const print = require('./../lib/print');
const evaluateFunctions = require('../lib/evaluateFunctions');

function testEvaluateFunctions(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(evaluateFunctions(flatten(math.parse(exprStr))).newNode),
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
