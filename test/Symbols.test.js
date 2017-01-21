'use strict';

const assert = require('assert');
const math = require('mathjs');

const print = require('../lib/util/print');
const Node = require('../lib/node');
const Symbols = require('../lib/Symbols');
const removeUnnecessaryParens = require('../lib/util/removeUnnecessaryParens');
const flatten = require('../lib/util/flattenOperands');
const TestHelper = require('./TestHelper');

let constNode = Node.Creator.constant;
let opNode = Node.Creator.operator;
let symbolNode = Node.Creator.symbol;

function testSimplify(exprStr, outputStr, debug=false) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(simplify(math.parse(exprStr), debug)),
      outputStr);
  });
}

function testGetLastSymbolTerm(exprString, expectedOutput) {
  it(exprString + ' -> ' + expectedOutput, function () {
    const expression = math.parse(exprString);
    const foundSymbol = Symbols.getLastSymbolTerm(expression, 'x');
    assert.deepEqual(
      print(foundSymbol),
      expectedOutput
    );
  });
}

describe('getLastSymbolTerm', function() {
  const tests = [
    ['1/x', '1 / x'],
    ['1/(3x)', '1 / (3x)'],
    ['3x', '3x'],
    ['x + 3x', '3x'],
    ['x/(x+3)', 'x / (x + 3)'],
  ];

  tests.forEach(t => testGetLastSymbolTerm(t[0], t[1]));
});
