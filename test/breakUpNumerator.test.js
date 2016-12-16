'use strict';

const assert = require('assert');
const math = require('mathjs');

const breakUpNumeratorSearch = require('../lib/breakUpNumeratorSearch');
const flatten = require('../lib/flattenOperands');
const print = require('../lib/util/print');

function testBreakUpNumerator(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(breakUpNumeratorSearch(flatten(math.parse(exprStr))).newNode),
      outputStr);
  });
}

describe('breakUpNumerator', function() {
  const tests = [
    ['(x+3+y)/3', '(x / 3 + 3/3 + y / 3)'],
    ['(2+x)/4', '(2/4 + x / 4)'],
    ['2(x+3)/3', '2 * (x / 3 + 3/3)'],
  ];
  tests.forEach(t => testBreakUpNumerator(t[0], t[1]));
});
