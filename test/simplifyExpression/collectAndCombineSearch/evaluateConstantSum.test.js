const evaluateConstantSum = require('../../../lib/simplifyExpression/collectAndCombineSearch/evaluateConstantSum');

const TestUtil = require('../../TestUtil');

function testEvaluateConstantSum(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  TestUtil.testSubsteps(evaluateConstantSum, exprString, outputList, lastString);
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
