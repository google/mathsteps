'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const simplifyFractionSigns = require('../../../lib/simplifyExpression/fractionsSearch/simplifyFractionSigns');


function testSimplifyFractionSigns(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplifyFractionSigns(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}

describe('simplify signs', function() {
  const tests = [
    ['-12x / -27', '12x / 27'],
    ['x / -y', '-x / y'],
  ];
  tests.forEach(t => testSimplifyFractionSigns(t[0], t[1]));
});
