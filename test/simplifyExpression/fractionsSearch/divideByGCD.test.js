const divideByGCD = require('../../../lib/simplifyExpression/fractionsSearch/divideByGCD');

const TestUtil = require('../../TestUtil');

function testDivideByGCD(exprStr, outputStr) {
  TestUtil.testSimplification(divideByGCD, exprStr, outputStr);
}

function testDivideByGCDSubsteps(exprString, outputList, outputStr) {
  TestUtil.testSubsteps(divideByGCD, exprString, outputList, outputStr);
}

describe('simplifyFraction', function() {
  const tests = [
    ['2/4', '1/2'],
    ['9/3', '3'],
    ['12/27', '4/9'],
    ['1/-3', '-1/3'],
    ['-3/-2', '3/2'],
    ['-1/-1', '1'],
  ];
  tests.forEach(t => testDivideByGCD(t[0], t[1]));
});

describe('simplifyFraction', function() {
  const tests = [
    ['15/6',
     ['15/3 / (6/3)'],
      '5/2',
    ],
    ['24/40',
     ['24/8 / (40/8)'],
      '3/5',
    ]
  ];
  tests.forEach(t => testDivideByGCDSubsteps(t[0], t[1], t[2]));
});
