const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');

const distributeSearch = require('../../../lib/simplifyExpression/distributeSearch');

function testDistributeMinus(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(flatten(distributeSearch(flatten(math.parse(exprStr))).newNode)),
      outputStr);
  });
}

describe('distribute - into paren with addition', function () {
  const tests = [
    ['-(x+3)', '(-x - 3)'],
    ['-(x - 3)', '(-x + 3)'],
    ['-(-x^2 + 3y^6)' , '(x^2 - 3y^6)'],
  ];
  tests.forEach(t => testDistributeMinus(t[0], t[1]));
});

describe('distribute - into paren with multiplication/division', function () {
  const tests = [
    ['-(x*3)', '(-x * 3)'],
    ['-(-x * 3)', '(x * 3)'],
    ['-(-x^2 * 3y^6)', '(x^2 * 3y^6)'],
  ];
  tests.forEach(t => testDistributeMinus(t[0], t[1]));
});

function testDistributeSteps(exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, function () {
    const status = distributeSearch(flatten(math.parse(exprString)));
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

describe('distribute', function () {
  const tests = [
    ['x*(x+2+y)',
      ['(x * x + x * 2 + x * y)',
        '(x^2 + 2x + x * y)']
    ],
    ['(x+2+y)*x*7',
      ['(x * x + 2 * x + y * x) * 7',
        '(x^2 + 2 * x + y * x) * 7']
    ],
    ['(5+x)*(x+3)',
      ['(5 * (x + 3) + x * (x + 3))',
        '((5 * x + 15) + (x^2 + 3x))']
    ],
    ['-2x^2 * (3x - 4)',
      ['(-2x^2 * 3x - 2x^2 * -4)',
        '(-6x^3 + 8x^2)']
    ],
  ];
  tests.forEach(t => testDistributeSteps(t[0], t[1]));
});
