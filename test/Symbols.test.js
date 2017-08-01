const assert = require('assert');
const math = require('mathjs');

const print = require('../lib/util/print');
const Symbols = require('../lib/Symbols');

function runTest(functionToTest, exprString, expectedOutput, symbolName) {
  it(exprString + ' -> ' + expectedOutput, function () {
    const expression = math.parse(exprString);
    const foundSymbol = functionToTest(expression, symbolName);
    assert.deepEqual(
      print.ascii(foundSymbol),
      expectedOutput
    );
  });
}

describe('getLastSymbolTerm', function() {
  const tests = [
    ['1/x', '1 / x', 'x'],
    ['1/(3x)', '1 / (3x)', 'x'],
    ['3x', '3x', 'x'],
    ['x + 3x + 2', '3x', 'x'],
    ['x/(x+3)', 'x / (x + 3)', 'x'],
    ['x/(x+3) + y', 'x / (x + 3)', 'x'],
    ['x/(x+3) + y + 3x', 'y', 'y'],
    ['x/(x+3) + y + 3x + 1/2y', '1/2 y', 'y'],
  ];

  tests.forEach(t => runTest(Symbols.getLastSymbolTerm, t[0], t[1], t[2]));
});

describe('getLastNonSymbolTerm', function() {
  const tests = [
    ['4x^2 + 2x + 2/4', '2/4', 'x'],
    ['4x^2 + 2/4 + x', '2/4', 'x'],
    ['4x^2 + 2x + y', 'y', 'x'],
    ['4x^2', '4', 'x'],
  ];

  tests.forEach(t => runTest(Symbols.getLastNonSymbolTerm, t[0], t[1], t[2]));
});

describe('getLastDenominatorWithSymbolTerm', function() {
  const tests = [
    ['1/x', 'x', 'x'],
    ['1/(x+2)', '(x + 2)', 'x'],
    ['1/(x+2) + 3x', '(x + 2)', 'x'],
    ['1/(x+2) + 3x/(1+x)', '(1 + x)', 'x'],
    ['1/(x+2) + (x+1)/(2x+3)', '(2x + 3)', 'x'],
    ['1/x + x/5', 'x', 'x'],
    ['2 + 2/x + x/2', 'x', 'x'],
    ['2 + 2/y + x/2', 'y', 'y'],
    ['2y + 2/x + 3/(2y) + x/2', '(2y)', 'y'],
  ];

  tests.forEach(t => runTest(Symbols.getLastDenominatorWithSymbolTerm, t[0], t[1], t[2]));
});
