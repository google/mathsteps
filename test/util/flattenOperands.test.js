const assert = require('assert');
const {build:b} = require('math-nodes');
const {parse, print} = require('math-parser');

const flattenOperands = require('../../lib/util/flattenOperands');

function testFlatten(exprStr, afterNode, debug=false) {
  it(`${exprStr} --> ${print(afterNode)}`, function() {
    const flattened = flattenOperands(parse(exprStr));
    if (debug) {
      // eslint-disable-next-line
      console.log(JSON.stringify(flattened, null, 4));
    }
    assert.deepEqual(flattened, afterNode);
  });
}

describe('flattens + and *', function () {
  const tests = [
    ['2+2', parse('2+2')],
    ['2+2+7', b.add(b.number('2'), b.number('2'), b.number('7'))],
    ['9*8*6+3+4',
      b.add(
        b.mul(b.number('9'), b.number('8'), b.number('6')),
        b.number('3'),
        b.number('4'))],
    ['5*(2+3+2)*10', parse('5*(2+3+2)*10')],
    // keeps the polynomial term
    ['9x*8*6+3+4',
      b.add(
        b.mul(parse('9x'), b.number('8'), b.number('6')),
        b.number('3'),
        b.number('4'))],
    ['9x*8*6+3y^2+4',
      b.add(
        b.mul(parse('9x'), b.number('8'), b.number('6')),
        parse('3y^2'),
        b.number('4'))],
    // doesn't flatten
    ['2 x ^ (2 + 1) * y', parse('2 x ^ (2 + 1) * y')],
    ['2 x ^ (2 + 1 + 2) * y',
      b.mul(
        b.implicitMul(b.number('2'),
          b.pow(b.identifier('x'),
            b.add(b.number('2'), b.number('1'), b.number('2')))),
        b.identifier('y'))
    ],
    ['3x*4x', b.mul(parse('3x'), parse('4x'))]
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});

describe('flattens division', function () {
  const tests = [
    // groups x/4 and continues to flatten *
    ['2 x / 4 * 6 ',
      b.mul(b.div(parse('2x'), parse('4')), b.number('6'))],
    ['2*3/4/5*6',
      b.mul(b.number('2'), parse('3/4/5'), b.number('6'))],
    // combines coefficient with x
    ['x / (4 * x) / 8',
      parse('x / (4x) / 8')],
    ['2 x * 4 x / 8',
      b.mul(
        parse('2x'),
        b.div(parse('4x'), b.number('8'))
      )
    ],
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});

describe('subtraction', function () {
  const tests = [
    ['1 + 2 - 3 - 4 + 5',
      b.add(
        b.number('1'),
        b.number('2'),
        b.neg(b.number('3'), {wasMinus: true}),
        b.neg(b.number('4'), {wasMinus: true}),
        b.number('5')
      )
    ],
    ['x - 3',
      b.add(b.identifier('x'), b.neg(b.number('3'), {wasMinus: true}))
    ],
    ['x + 4 - (y+4)',
      b.add(
        b.identifier('x'),
        b.number(4),
        b.neg(parse('y+4'), {wasMinus: true})
      )
    ],
  ];
  tests.forEach(t => testFlatten(t[0], t[1]));
});
