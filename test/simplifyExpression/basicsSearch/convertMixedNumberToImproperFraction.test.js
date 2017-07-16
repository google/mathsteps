const convertMixedNumberToImproperFraction = require(
  '../../../lib/simplifyExpression/basicsSearch/convertMixedNumberToImproperFraction');

const TestUtil = require('../../TestUtil');

function testConvertMixedNumberToImproperFraction(exprString, outputList, outputStr) {
  TestUtil.testSubsteps(convertMixedNumberToImproperFraction, exprString, outputList, outputStr);
}

describe('convertMixedNumberToImproperFraction', function() {
  const tests = [
    ['1(2)/(3)',
      ['((1 * 3) + 2) / 3',
        '(3 + 2) / 3',
        '5/3'],
      '5/3'
    ],
    ['19(4)/(8)',
      ['((19 * 8) + 4) / 8',
        '(152 + 4) / 8',
        '156/8'],
      '156/8'
    ],
    ['-5(10)/(11)',
      ['-((5 * 11) + 10) / 11',
        '-(55 + 10) / 11',
        '-65/11'],
      '-65/11'
    ],
  ];
  tests.forEach(t => testConvertMixedNumberToImproperFraction(t[0], t[1], t[2]));
});
