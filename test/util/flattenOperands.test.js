// TODO: Review implementetion from branch 'division'
// It seems much cleaner than original one.

const assert = require('assert')
const math = require('mathjs')

const print = require('../../lib/util/print')

const Node = require('../../lib/node')
const TestUtil = require('../TestUtil')

function testFlatten(exprStr, afterNode, debug = false) {
  const flattened = TestUtil.parseAndFlatten(exprStr)
  if (debug) {
    // eslint-disable-next-line
    console.log(print.ascii(flattened));
  }
  TestUtil.removeComments(flattened)
  TestUtil.removeComments(afterNode)
  it(print.ascii(flattened), function() {
    assert.deepEqual(flattened, afterNode)
  })
}

// to create nodes, for testing
const opNode = Node.Creator.operator
const constNode = Node.Creator.constant
const symbolNode = Node.Creator.symbol
const parenNode = Node.Creator.parenthesis
const unaryMinusNode = Node.Creator.unaryMinus
const nthRootNode = Node.Creator.nthRoot
const absNode = Node.Creator.kemuCreateAbs

const node2x = opNode('*', [constNode(2), symbolNode('x')], true)
const node3x = opNode('*', [constNode(3), symbolNode('x')], true)
const node4x = opNode('*', [constNode(4), symbolNode('x')], true)
const node9x = opNode('*', [constNode(9), symbolNode('x')], true)
const node3y = opNode('*', [constNode(3), symbolNode('y')], true)

describe('flattens + and *', function () {
  const tests = [
    ['2+2', opNode('+', [constNode(2), constNode(2)])],
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
        opNode('*', [node9x, constNode(8), constNode(6)]),
        constNode(3),
        constNode(4)])],

    ['9x*8*6+3y^2+4',
      opNode('+', [
        opNode('*', [node9x, constNode(8), constNode(6)]),
        opNode('*', [constNode(3), opNode('^', [symbolNode('y'), constNode(2)])], true),
        constNode(4)
      ])
    ],

    // doesn't flatten
    ['2 x ^ (2 + 1) * y',
      opNode('*', [
        opNode('*', [
          constNode(2),
          opNode('^', [
            symbolNode('x'),
            parenNode(opNode('+', [constNode(2), constNode(1)])),
          ])
        ], true),
        symbolNode('y')
      ])
    ],

    ['2 x ^ (2 + 1 + 2) * y',
      opNode('*', [
        opNode('*', [constNode(2),
          opNode('^', [symbolNode('x'), parenNode(
            opNode('+', [constNode(2), constNode(1), constNode(2)]))]),
        ], true), symbolNode('y')])
    ],

    ['3x*4x', opNode('*', [node3x, node4x])]
  ]
  tests.forEach(t => testFlatten(t[0], t[1]))
})

describe('flattens division', function () {
  const tests = [
    // groups x/4 and continues to flatten *
    ['2 * x / 4 * 6 ',
      opNode('*', [opNode('/', [
        node2x, constNode(4)]), constNode(6)])],

    ['2*3/4/5*6',
      opNode('*', [
        constNode(2),
        opNode('/', [
          opNode('/', [constNode(3), constNode(4)]),
          constNode(5)
        ]),
        constNode(6)
      ])
    ],

    // combines coefficient with x
    ['x / (4 * x) / 8',
      opNode('/', [
        opNode('/', [
          symbolNode('x'),
          parenNode(node4x)
        ]),
        constNode(8)
      ])
    ],

    ['2 x * 4 x / 8',
      opNode('*', [node2x, opNode(
        '/', [node4x, constNode(8)])])],
  ]
  tests.forEach(t => testFlatten(t[0], t[1]))
})

describe('subtraction', function () {
  const tests = [
    ['1 + 2 - 3 - 4 + 5',
      opNode('+', [
        constNode(1), constNode(2), constNode(-3), constNode(-4), constNode(5)])],

    ['x - 3', opNode('+', [symbolNode('x'), constNode(-3)])],

    ['x + 4 - (y+4)',
      opNode('+', [
        symbolNode('x'),
        constNode(4),
        unaryMinusNode(
          parenNode(
            opNode('+', [symbolNode('y'), constNode(4)])
          )
        )
      ])
    ],
  ]
  tests.forEach(t => testFlatten(t[0], t[1]))
})

describe('flattens nested functions', function () {
  const tests = [
    ['sqrt(11)(x+y)',
      opNode('*', [
        nthRootNode(constNode(11)),
        parenNode(opNode('+', [symbolNode('x'), symbolNode('y')]))
      ])

      // math.parse('nthRoot(11) * (x+y)')
    ],

    ['abs(3)(1+2)',
      opNode('*', [
        absNode(constNode(3)),
        parenNode(
          opNode('+', [constNode(1), constNode(2)])
        )
      ])
    ],

    ['sqrt(2)(sqrt(18)+4*sqrt(3))',
      opNode('*', [
        nthRootNode(constNode(2)),
        parenNode(
          opNode('+', [
            nthRootNode(constNode(18)),
            opNode('*', [
              constNode(4),
              nthRootNode(constNode(3))
            ])
          ])
        )
      ])
    ],

    ['nthRoot(6,3)(10+4x)',
      opNode('*', [
        nthRootNode(constNode(6), constNode(3)),
        parenNode(
          opNode('+', [
            constNode(10),
            node4x
          ])
        )
      ])
    ]
  ]
  tests.forEach(t => testFlatten(t[0], t[1]))
})
