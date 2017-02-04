const addConstantFractions = require('../../../lib/simplifyExpression/fractionsSearch/addConstantFractions');

const TestUtil = require('../../TestUtil');

function testAddConstantFractions(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  TestUtil.testSubsteps(addConstantFractions, exprString, outputList, lastString);
}

describe('addConstantFractions', function () {
  const tests = [
    ['4/5 + 3/5',
      ['(4 + 3) / 5',
        '7/5']
    ],
    ['4/10 + 3/5',
      ['4/10 + (3 * 2) / (5 * 2)',
        '4/10 + (3 * 2) / 10',
        '4/10 + 6/10',
        '(4 + 6) / 10',
        '10/10',
        '1']
    ],
    ['4/9 + 3/5',
      ['(4 * 5) / (9 * 5) + (3 * 9) / (5 * 9)',
        '(4 * 5) / 45 + (3 * 9) / 45',
        '20/45 + 27/45',
        '(20 + 27) / 45',
        '47/45']
    ],
    ['4/5 - 4/5',
      ['(4 - 4) / 5',
        '0/5',
        '0']
    ],
  ];
  tests.forEach(t => testAddConstantFractions(t[0], t[1]));
});
