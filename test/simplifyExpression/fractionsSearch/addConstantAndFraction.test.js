'use strict';

const assert = require('assert');
const math = require('mathjs');

const print = require('../../../lib/util/print');

const addConstantAndFraction = require('../../../lib/simplifyExpression/fractionsSearch/addConstantAndFraction');

function testAddConstantAndFraction(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, function () {
    const status = addConstantAndFraction(math.parse(exprString));
    const substeps = status.substeps;
    substeps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });
    assert.deepEqual(
      print(status.newNode),
      lastString);
  });
}

describe('addConstantAndFraction', function () {
  const tests = [
    ['7 + 1/2',
      ['14/2 + 1/2',
        '(14 + 1) / 2',
        '15/2']
    ],
    ['5/6 + 3',
      ['5/6 + 18/6',
        '(5 + 18) / 6',
        '23/6'],
    ],
    ['1/2 + 5.8',
      ['0.5 + 5.8',
        '6.3'],
    ],
    ['1/3 + 5.8',
      ['0.3333 + 5.8',
        '6.1333']
    ],
  ];
  tests.forEach(t => testAddConstantAndFraction(t[0], t[1]));
});
