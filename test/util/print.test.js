const math = require('mathjs');

const print = require('../../lib/util/print');
const Node = require('../../lib/node');

const TestUtil = require('../TestUtil');

// to create nodes, for testing
const opNode = Node.Creator.operator;
const constNode = Node.Creator.constant;
const symbolNode = Node.Creator.symbol;

function testPrintStr(exprStr, outputStr) {
  const input = math.parse(exprStr);
  TestUtil.testFunctionOutput(print, input, outputStr);
}

function testPrintNode(node, outputStr) {
  TestUtil.testFunctionOutput(print, node, outputStr);
}

describe('print asciimath', function () {
  const tests = [
    ['2+3+4', '2 + 3 + 4'],
    ['2 + (4 - x) + - 4', '2 + (4 - x) - 4'],
    ['2/3 x^2', '2/3 x^2'],
    ['-2/3', '-2/3'],
  ];
  tests.forEach(t => testPrintStr(t[0], t[1]));
});

describe('print with parenthesis', function () {
  const tests = [
    [opNode('*', [
        opNode('+', [constNode(2), constNode(3)]),
        symbolNode('x')
      ]), '(2 + 3) * x'],
    [opNode('^', [
        opNode('-', [constNode(7), constNode(4)]),
        symbolNode('x')
      ]), '(7 - 4)^x'],
    [opNode('/', [
        opNode('+', [constNode(9), constNode(2)]),
        symbolNode('x')
      ]), '(9 + 2) / x'],
  ];
  tests.forEach(t => testPrintNode(t[0], t[1]));
})
