const assert = require('assert');
const math = require('../../../index');

const distribute = require('../../../lib/expression/step-solver/distribute.js');
const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');
const print = require('./../../../lib/expression/step-solver/prettyPrint');

function testDistribute(exprStr, outputStr) {
  it(exprStr + ' -> ' + outputStr, function () {
    assert.deepEqual(
      print(flatten(distribute(flatten(math.parse(exprStr))).newNode)),
      outputStr);
  });
}

describe('distribute - into paren with addition', function () {
  const tests = [
    ['-(x+3)', '(-x - 3)'],
    ['-(x - 3)', '(-x + 3)'],
    ['-(-x^2 + 3y^6)' , '(x^2 - 3y^6)'],
  ];
  tests.forEach(t => testDistribute(t[0], t[1]));
});

describe('distribute - into paren with multiplication/division', function () {
  const tests = [
    ['-(x*3)', '(-x * 3)'],
    ['-(-x * 3)', '(x * 3)'],
    ['-(-x^2 * 3y^6)', '(x^2 * 3y^6)'],
  ];
  tests.forEach(t => testDistribute(t[0], t[1]));
});

describe('distribute', function () {
  const tests = [
    ['x*(x+2+y)', '(x * x + x * 2 + x * y)'],
    ['(x+2+y)*x*7', '(x * x + 2 * x + y * x) * 7'],
    ['(5+x)*(x+3)', '(5 * (x + 3) + x * (x + 3))'],
    ['-2x^2 * (3x - 4)', '(-2x^2 * 3x - 2x^2 * -4)'],
  ];
  tests.forEach(t => testDistribute(t[0], t[1]));
});
