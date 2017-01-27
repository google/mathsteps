'use strict';

const assert = require('assert');
const math = require('mathjs');

const flattenOperands = require('../../lib/util/flattenOperands');
const print = require('../../lib/util/print');

const Node = require('../../lib/node');

function testFlatten(exprStr, afterNode, debug=false) {
  const flattened = flattenOperands(math.parse(exprStr));
  if (debug) {
    // eslint-disable-next-line
    console.log(print(flattened));
  }
  removeComments(flattened);
  removeComments(afterNode);
  it(print(flattened), function() {
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
    ['2+2', math.parse('2+2')],
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
        opNode('*', [math.parse('9x'), constNode(8), constNode(6)]),
        constNode(3),
        constNode(4)])],
    ['9x*8*6+3y^2+4',
      opNode('+', [
        opNode('*', [math.parse('9x'), constNode(8), constNode(6)]),
        math.parse('3y^2'),
        constNode(4)])],
    // doesn't flatten
    ['2 x ^ (2 + 1) * y', math.parse('2 x ^ (2 + 1) * y')],
    ['2 x ^ (2 + 1 + 2) * y',
      opNode('*', [
        opNode('*', [constNode(2),
          opNode('^', [symbolNode('x'), parenNode(
            opNode('+', [constNode(2), constNode(1), constNode(2)]))]),
        ], true), symbolNode('y')])
    ],
    ['3x*4x', opNode('*', [math.parse('3x'), math.parse('4x')])]
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});

describe('flattens division', function () {
  const tests = [
    // groups x/4 and continues to flatten *
    ['2 * x / 4 * 6 ',
      opNode('*', [opNode('/', [
        math.parse('2x'), math.parse('4')]), constNode(6)])],
    ['2*3/4/5*6',
      opNode('*', [constNode(2), math.parse('3/4/5'), constNode(6)])],
    // combines coefficient with x
    ['x / (4 * x) / 8',
      math.parse('x / (4x) / 8')],
    ['2 x * 4 x / 8',
      opNode('*', [math.parse('2x'), opNode(
        '/', [math.parse('4x'), constNode(8)])])],
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
      opNode('+', [symbolNode('x'), constNode(4), math.parse('-(y+4)')])],
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});


// Remove some property used in mathjs that we don't need and prevents node
// equality checks from passing
function removeComments(node) {
  node.filter(node => node.comment !== undefined).forEach(
    node => delete node.comment);
}
