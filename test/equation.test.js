const assert = require('assert');

const Equation = require('../lib/equation/Equation');

function makeEquation(left, right, comp) {
  return (new Equation(left, right, comp).print());
}

function equationRepresenter(left, right, comp, output) {
  it ('represents an equation', () => {
    assert.equal(
      makeEquation(left, right, comp), output
    );
  });
}

describe('Equation constructor', () => {
  const tests = [
    ['2*x^2 + x', '4', '=', '2*x^2 + x = 4'],
    ['x^2 + 2*x + 2', '0', '>=', 'x^2 + 2*x + 2 >= 0'],
    ['2*x - 1', '0', '<=', '2*x - 1 <= 0']
  ];
  tests.forEach(t => equationRepresenter(t[0], t[1], t[2], t[3]));
});
