'use strict';

const assert = require('assert');
const math = require('../../../index');

const simplifyDivision = require('../../../lib/expression/step-solver/simplifyDivision.js');
const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');
const print = require('../../../lib/expression/step-solver/prettyPrint.js');

function testSimplifyDivision(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplifyDivision(flatten(math.parse(exprStr))).node),
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
