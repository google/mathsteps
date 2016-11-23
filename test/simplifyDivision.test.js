'use strict';

const assert = require('assert');
const math = require('mathjs');

const simplifyDivision = require('../lib/simplifyDivision');
const flatten = require('../lib/flattenOperands');
const print = require('../lib/print');

function testSimplifyDivision(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplifyDivision(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}

describe('simplifyDivision', function () {
  const tests = [
    ['6/x/5', '6 / (x * 5)'],
    ['-(6/x/5)', '-(6 / (x * 5))'],
    ['-6/x/5', '-6 / (x * 5)'],
    ['(2+2)/x/6/(y-z)','(2 + 2) / (x * 6 * (y - z))'],
    ['2/x', '2 / x'],
  ];
  tests.forEach(t => testSimplifyDivision(t[0], t[1]));
});
