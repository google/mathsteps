'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const rearrangeCoefficient = require('../../../lib/simplifyExpression/basics/rearrangeCoefficient');

function testRearrangeCoefficient(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    const newNode = rearrangeCoefficient(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

describe('rearrangeCoefficient', function() {
  const tests = [
    ['2 * x^2', '2x^2'],
    ['y^3 * 5', '5y^3'],
  ];
  tests.forEach(t => testRearrangeCoefficient(t[0], t[1]));
});
