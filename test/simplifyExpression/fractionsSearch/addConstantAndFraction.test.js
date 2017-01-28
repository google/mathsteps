'use strict';

const addConstantAndFraction = require('../../../lib/simplifyExpression/fractionsSearch/addConstantAndFraction');

const TestUtil = require('../../TestUtil');

function testAddConstantAndFraction(exprString, outputList) {
  TestUtil.verifyDistributeSteps(addConstantAndFraction, exprString, outputList);
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
