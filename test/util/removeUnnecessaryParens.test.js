const assert = require('assert');
const {parse, print} = require('math-parser');

const removeUnnecessaryParens = require('../../lib/util/removeUnnecessaryParens');

function testRemoveUnnecessaryParens(exprStr, outputStr) {
  const input = print(removeUnnecessaryParens(parse(exprStr)));
  it(input + ' -> ' + outputStr, () => {
    assert.equal(input, outputStr);
  });
}

describe('removeUnnecessaryParens', function () {
  const tests = [
    ['(x+4) + 12', 'x + 4 + 12'],
    ['-(x+4x) + 12', '-(x + 4 x) + 12'],
    ['x + (12)', 'x + 12'],
    ['x + (y)', 'x + y'],
    ['x + -(y)', 'x - y'],
    ['((3 - 5)) * x', '(3 - 5) * x'],
    ['((3 - 5)) * x', '(3 - 5) * x'],
    ['(((-5)))', '-5'],
    ['((4+5)) + ((2^3))', '4 + 5 + 2^3'],
    // TODO(kevinb): fix this test
    // ['(2x^6 + -50 x^2) - (x^4)', '2 x^6 - 50 x^2 - x^4'],
    ['(x+4) - (12 + x)', 'x + 4 - (12 + x)'],
    ['(2x)^2', '(2 x)^2'],
    ['((4+x)-5)^(2)', '(4 + x - 5)^2'],
  ];
  tests.forEach(t => testRemoveUnnecessaryParens(t[0], t[1]));
});
