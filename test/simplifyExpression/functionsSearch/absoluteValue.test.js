'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const absoluteValue = require('../../../lib/simplifyExpression/functionsSearch/absoluteValue');

function testAbsoluteValue(exprString, outputStr) {
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(absoluteValue(flatten(math.parse(exprString))).newNode),
      outputStr);
  });
}

describe('abs', function () {
  const tests = [
    ['abs(4)', '4'],
    ['abs(-5)', '5'],
  ];
  tests.forEach(t => testAbsoluteValue(t[0], t[1]));
});
