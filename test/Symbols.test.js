const assert = require('assert');
const math = require('mathjs');

const print = require('../lib/util/print');
const Symbols = require('../lib/Symbols');

function runTest(functionToTest, exprString, expectedOutput) {
  it(exprString + ' -> ' + expectedOutput, function () {
    const expression = math.parse(exprString);
    const foundSymbol = functionToTest(expression, 'x');
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

  tests.forEach(t => runTest(Symbols.getLastSymbolTerm, t[0], t[1]));
});

describe('getLastDenominatorWithSymbolTerm', function() {
  const tests = [
    ['1/x', 'x'],
    ['1/(x+2)', '(x + 2)'],
    ['1/(x+2) + 3x', '(x + 2)'],
    ['1/(x+2) + 3x/(1+x)', '(1 + x)'],
  ];

  tests.forEach(t => runTest(Symbols.getLastDenominatorWithSymbolTerm, t[0], t[1]));
});

