const assert = require('assert');

const Equation = require('../lib/equation/Equation');

function constructAndPrintEquation(left, right, comp) {
  const equation = new Equation(left, right, comp);
  return equation.print();
}

function testEquationConstructor(left, right, comp, output) {
  it (output, () => {
    assert.equal(
      constructAndPrintEquation(left, right, comp), output
    );
  });
}

describe('Equation constructor', () => {
  const tests = [
    ['2*x^2 + x', '4', '=', '2*x^2 + x = 4'],
    ['x^2 + 2*x + 2', '0', '>=', 'x^2 + 2*x + 2 >= 0'],
    ['2*x - 1', '0', '<=', '2*x - 1 <= 0']
  ];
  tests.forEach(t => testEquationConstructor(t[0], t[1], t[2], t[3]));
});