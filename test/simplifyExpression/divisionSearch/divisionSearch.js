'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const divisionSearch = require('../../../lib/simplifyExpression/divisionSearch');

function testSimplifyDivision(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(divisionSearch(flatten(math.parse(exprStr))).newNode),
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
    ['x/(2/3)', 'x * 3/2'],
    ['x / (y/(z+a))', 'x * (z + a) / y'],
    ['x/((2+z)/(3/y))', 'x * (3 / y) / (2 + z)'],
  ];
  tests.forEach(t => testSimplifyDivision(t[0], t[1]));
});
