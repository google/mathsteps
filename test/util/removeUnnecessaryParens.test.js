const {parse} = require('math-parser');

const print = require('../../lib/util/print');
const removeUnnecessaryParens = require('../../lib/util/removeUnnecessaryParens');

const TestUtil = require('../TestUtil');

function testRemoveUnnecessaryParens(inputString, outputString) {
  it(inputString + ' -> ' + outputString,  () => {
    const input = TestUtil.parseAndFlatten(inputString);
    assert.deepEqual(removeUnnecessaryParens(input), outputString);
  });
}

describe('removeUnnecessaryParens', function () {
  const tests = [
    ['(x+4) + 12', 'x + 4 + 12'],
    ['-(x+4x) + 12', '-(x + 4x) + 12'],
    ['x + (12)', 'x + 12'],
    ['x + (y)', 'x + y'],
    ['x + -(y)', 'x - y'],
    ['((3 - 5)) * x', '(3 - 5) * x'],
    ['((3 - 5)) * x', '(3 - 5) * x'],
    ['(((-5)))', '-5'],
    ['((4+5)) + ((2^3))', '(4 + 5) + 2^3'],
    ['(2x^6 + -50 x^2) - (x^4)', '2x^6 - 50x^2 - x^4'],
    ['(x+4) - (12 + x)', 'x + 4 - (12 + x)'],
    ['(2x)^2', '(2x)^2'],
    ['((4+x)-5)^(2)', '(4 + x - 5)^2'],
  ];
  tests.forEach(t => testRemoveUnnecessaryParens(t[0], t[1]));
});
