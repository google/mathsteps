const assert = require('assert');
const math = require('../../../index');

const cancelLikeTerms = require('../../../lib/expression/step-solver/cancelLikeTerms.js');
const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');
const print = require('../../../lib/expression/step-solver/prettyPrint.js');

// TODO: set up more test files like this one

function testCancelLikeTerms(exprStr, expectedStr) {
  const evaluted = cancelLikeTerms(flatten(math.parse(exprStr))).node;
  assert.deepEqual(
    print(evaluted),
    expectedStr);
  return
}

describe('cancel like terms', function () {
  const tests = [
    ['2/2', '1'],
    ['x^2/x^2', '1'],
    ['x^3/x^2', 'x^(3 - (2))'], // parens will be removed at end of step
    ['(x^3*y)/x^2', '(x^(3 - (2)) * y)'],
    ['-(7+x)^8/(7+x)^2', '-((7 + x)^(8 - (2)))'],
    ['(2x^2 * 5) / (2x^2)', '5'], // these parens have to stay around 2x^2 to be parsed correctly.
    ['(x^2 * y) / x', '(x^(2 - (1)) * y)'],
    ['2x^2 / (2x^2 * 5)', '1/5'],
    ['x / (x^2*y)', 'x^(1 - (2)) / y'],
    ['(4x^2) / (5x^2)', '(4) / (5)'],
    ['(2x+5)^8 / (2x+5)^2', '(2x + 5)^(8 - (2))'],
    ['(4x^3) / (5x^2)', '(4x^(3 - (2))) / (5)'],
    ['-x / -x', '1'],
  ];

  tests.forEach(t => {
    const before = t[0];
    const after = t[1];
    it(before + ' -> ' + after, function () {
      testCancelLikeTerms(before, after);
    });
  });
});
