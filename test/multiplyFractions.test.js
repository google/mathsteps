'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/util/flattenOperands');
const multiplyFractionsSearch = require('../lib/multiplyFractionsSearch');
const print = require('../lib/util/print');

function testMultiplyFractions(exprString, outputStr) {
  const node = flatten(math.parse(exprString));
  it(exprString + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(multiplyFractionsSearch(node).newNode),
      outputStr);
  });
}

describe('multiplyFractions', function () {
  const tests = [
    ['3 * 1/5 * 5/9', '(3 * 1 * 5) / (5 * 9)'],
    ['3/7 * 10/11', '(3 * 10) / (7 * 11)'],
    ['2 * 5/x', '(2 * 5) / x']
  ];
  tests.forEach(t => testMultiplyFractions(t[0], t[1]));
});
