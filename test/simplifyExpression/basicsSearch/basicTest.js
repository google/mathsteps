const assert = require('assert');

const {parse, print} = require('math-parser');

const basic_rules = require('../../../lib/simplifyExpression/basicsSearch/basicRules');

describe('basic rules', function() {
  describe('negation', function() {
    const tests = [
      ['--1','1'],
      ['--x','x'],
      ['--(x + 1)', 'x + 1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.negation));
  })

  describe.skip('rearrange coefficient', function() {
    const tests = [
        ['y^3 * 5', '5 y^3'],
        ['yz * 3', '3 yz'],
        // TODO: handle this case better
        //['3x^2 * 5', '5 (3 x^2)']
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.REARRANGE_COEFF));
  })

  describe('division by negative one', function() {
    const tests = [
      ['2 / -1','-2'],
      ['x / -1','-x'],
      ['(x + 1) / -1', '-(x + 1)'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeDivisionByOne));
  })

  describe('division by one', function() {
    const tests = [
      ['2 / 1', '2'],
      ['x / 1', 'x'],
      ['(x + 1) / 1', 'x + 1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeDivisionByOne));
  })

  describe('multiply by zero', function() {
    const tests = [
      ['2 * 0', '0'],
      ['x * 0', '0'],
      ['x 0', '0'],
      ['(x + 1) * 0', '0'],
      // reverse
      ['0 * 2', '0'],
      ['0 * x', '0'],
      ['0 x', '0'],
      ['0 * (x + 1)', '0'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeMultiplicationByZero));
  })

  describe('reduce exponent by zero', function() {
    const tests = [
      ['2 ^ 0', '1'],
      ['x ^ 0', '1'],
      ['(x + 1) ^ 0', '1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeExponentByZero));
  })

  describe('reduce zero numerator', function() {
    const tests = [
      ['0 / 2', '0'],
      ['0 / x', '0'],
      ['0 / (x + 1)', '0'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeDivisionByZero));
  })


  describe('remove adding zero', function() {
    const tests = [
      ['2 + 0', '2'],
      ['2 + 0 + x', '2 + x'],
      ['x + 0', 'x'],
      ['(x + 1) + 0', 'x + 1'],
      //reverse
      ['0 + 2', '2'],
      ['0 + x', 'x'],
      ['0 + (x + 1)', 'x + 1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeAdditionOfZero));
  })

  describe('remove exponent by one', function() {
    const tests = [
      ['2 ^ 1', '2'],
      ['x ^ 1', 'x'],
      ['(x + 1) ^ 1', 'x + 1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeExponentByOne));
  })

  describe('remove exponent by base one', function() {
    const tests = [
        ['1 ^ 2', '1'],
        //['1 ^ x', '1'],
        //['1 ^ (x + 1)', '1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeExponentBaseOne));
  })

  describe('remove multiplying by negative one', function() {
    const tests = [
      ['2 * -1', '-2'],
      ['x * -1', '-x'],
      ['(x + 1) * -1', '-(x + 1)'],
      ['2x * 2 * -1', '2 x * -2'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeMultiplicationByNegativeOne));
  })

  describe('remove multiplying by one', function() {
    const tests = [
      ['2 * 1', '2'],
      ['x * 1', 'x'],
      ['x 1', 'x'],
      ['(x + 1) * 1', 'x + 1'],
      ['2 * 1 * z^2', '2 * z^2'],
      // reverse
      ['1 * 2', '2'],
      ['1 * x', 'x'],
      ['1 x', 'x'],
      ['1 * (x + 1)', 'x + 1'],
    ]
    tests.forEach(t => testSimplify(t[0], t[1], basic_rules.removeMultiplicationByOne));
  })
});

function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = parse(exprStr);
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

module.exports = testSimplify;
