'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const evaluateConstantSum = require('../../../lib/simplifyExpression/collectAndCombineSearch/evaluateConstantSum');

function testEvaluateConstantSum(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, function () {
    const status = evaluateConstantSum(flatten(math.parse(exprString)));
    const substeps = status.substeps;

    assert.deepEqual(substeps.length, outputList.length);
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

describe('evaluateConstantSum', function () {
  const tests = [
    ['4/10 + 3/5',
      ['4/10 + (3 * 2) / (5 * 2)',
        '4/10 + (3 * 2) / 10',
        '4/10 + 6/10',
        '(4 + 6) / 10',
        '10/10',
        '1']
    ],
    ['4/5 + 3/5 + 2',
      ['2 + (4/5 + 3/5)',
        '2 + 7/5',
        '17/5']
    ],
    ['9 + 4/5 + 1/5 + 2',
      ['(9 + 2) + (4/5 + 1/5)',
        '11 + (4/5 + 1/5)',
        '11 + 1',
        '12']
    ],
  ];
  tests.forEach(t => testEvaluateConstantSum(t[0], t[1]));
});
