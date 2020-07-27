const assert = require('assert');
const {parse} = require('math-parser');

const Node = require('../../lib/node');
const print = require('../../lib/util/print');

// to create nodes, for testing
const opNode = Node.Creator.operator;
const constNode = Node.Creator.constant;
const symbolNode = Node.Creator.symbol;

function testPrintStr(exprStr, outputStr) {
  it(`tests printing ${exprStr} as ${outputStr}`,  () => {
    assert.deepEqual(print.ascii(parse(exprStr)), outputStr);
  });
}

function testLatexPrintStr(exprStr, outputStr) {
  it(`tests printing ${exprStr} as ${outputStr}`,  () => {
    assert.deepEqual(print.latex(parse(exprStr)), outputStr);
  });
}

function testPrintNodeToLatex(node, outputStr) {
  it(`tests printing ${outputStr}`,  () => {
    assert.deepEqual(print.latex(node), outputStr);
  });
}

describe('print asciimath', function () {
  const tests = [
    ['2+3+4', '2 + 3 + 4'],
    ['2 + (4 - x) + - 4', '2 + (4 - x) - 4'],
    // TODO(math-parser or porting): standardize spacing for printing
    //    ['2/3 x^2', '2/3 x^2'],
    //    ['-2/3', '-2/3'],
  ];
  tests.forEach(t => testPrintStr(t[0], t[1]));
});

// TODO(math-parser): expose latex printing
describe.skip('print latex', function() {
  const tests = [
    ['2+3+4', '2+3+4'],
    ['2 + (4 - x) - 4', '2+\\left(4 -  x\\right) - 4'],
    ['2/3 x^2', '\\frac{2}{3}~{ x}^{2}'],
    ['-2/3', '\\frac{-2}{3}'],
    ['2*x+4y', '2~ x+4~ y'],
  ];
  tests.forEach(t => testLatexPrintStr(t[0],t[1]));
});

// TODO(math-parser): expose latex printing
describe.skip('print latex with parenthesis', function () {
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
  tests.forEach(t => testPrintNodeToLatex(t[0], t[1]));
});
