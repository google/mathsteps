const assert = require('assert');
const {parse} = require('math-parser');

const print = require('../../lib/util/print');

const Node = require('../../lib/node');
const TestUtil = require('../TestUtil');

function testFlatten(exprStr, afterNode, debug=false) {
  const flattened = TestUtil.parseAndFlatten(exprStr);
  if (debug) {
    // eslint-disable-next-line
    console.log(print.ascii(flattened));
  }
  it(print.ascii(flattened), function() {
    assert.deepEqual(flattened, afterNode);
  });
}

// to create nodes, for testing
const opNode = Node.Creator.operator;
const constNode = Node.Creator.constant;
const symbolNode = Node.Creator.symbol;
const parenNode = Node.Creator.parenthesis;

describe('flattens + and *', function () {
  const tests = [
    ['2+2', parse('2+2')],
    ['2+2+7', opNode('+', [constNode(2), constNode(2), constNode(7)])],
    ['9*8*6+3+4',
      opNode('+', [
        opNode('*', [constNode(9), constNode(8), constNode(6)]),
        constNode(3),
        constNode(4)])],
    ['5*(2+3+2)*10',
      opNode('*', [
        constNode(5),
        parenNode(opNode('+', [constNode(2), constNode(3),constNode(2)])),
        constNode(10)])],
    // keeps the polynomial term
    ['9x*8*6+3+4',
      opNode('+', [
        opNode('*', [parse('9x'), constNode(8), constNode(6)]),
        constNode(3),
        constNode(4)])],
    ['9x*8*6+3y^2+4',
      opNode('+', [
        opNode('*', [parse('9x'), constNode(8), constNode(6)]),
        parse('3y^2'),
        constNode(4)])],
    // doesn't flatten
    ['2 x ^ (2 + 1) * y', parse('2 x ^ (2 + 1) * y')],
    ['2 x ^ (2 + 1 + 2) * y',
      opNode('*', [
        opNode('*', [constNode(2),
          opNode('^', [symbolNode('x'), parenNode(
            opNode('+', [constNode(2), constNode(1), constNode(2)]))]),
        ], true), symbolNode('y')])
    ],
    ['3x*4x', opNode('*', [parse('3x'), parse('4x')])]
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});

describe('flattens division', function () {
  const tests = [
    // groups x/4 and continues to flatten *
    ['2 * x / 4 * 6 ',
      opNode('*', [opNode('/', [
        parse('2x'), parse('4')]), constNode(6)])],
    ['2*3/4/5*6',
      opNode('*', [constNode(2), parse('3/4/5'), constNode(6)])],
    // combines coefficient with x
    ['x / (4 * x) / 8',
      parse('x / (4x) / 8')],
    ['2 x * 4 x / 8',
      opNode('*', [parse('2x'), opNode(
        '/', [parse('4x'), constNode(8)])])],
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});

describe('subtraction', function () {
  const tests = [
    ['1 + 2 - 3 - 4 + 5',
      opNode('+', [
        constNode(1), constNode(2), constNode(-3), constNode(-4), constNode(5)])],
    ['x - 3', opNode('+', [symbolNode('x'), constNode(-3)])],
    ['x + 4 - (y+4)',
      opNode('+', [symbolNode('x'), constNode(4), parse('-(y+4)')])],
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});

describe('flattens nested functions', function () {
  const tests = [
    ['nthRoot(11)(x+y)',
      parse('nthRoot(11) * (x+y)')],
    ['|3|(1+2)',
      parse('|3isMixedNumber| * (1+2)')],
    ['nthRoot(2)(nthRoot(18)+4*nthRoot(3))',
      parse('nthRoot(2) * (nthRoot(18)+4*nthRoot(3))')],
    ['nthRoot(6,3)(10+4x)',
      parse('nthRoot(6,3) * (10+4x)')]
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});
