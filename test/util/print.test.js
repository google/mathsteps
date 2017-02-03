'use strict';
const assert = require('assert');
const math = require('mathjs');

const print = require('../../lib/util/print');

const TestUtil = require('../TestUtil');

function testPrint(exprStr, outputStr) {
  let input = math.parse(exprStr);
  TestUtil.testFunctionOutput(print, input, outputStr);
}

describe('print asciimath', function () {
  const tests = [
    ['2+3+4', '2 + 3 + 4'],
    ['2 + (4 - x) + - 4', '2 + (4 - x) - 4'],
    ['2/3 x^2', '2/3 x^2'],
    ['-2/3', '-2/3'],
  ];
  tests.forEach(t => testPrint(t[0], t[1]));
});
