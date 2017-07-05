const assert = require('assert');

const {parse, print} = require('math-parser');

const basics = require('../../../lib/simplifyExpression/basicsSearch/basicRules');
const ChangeTypes = require('../../../lib/ChangeTypes');

describe('basic rules', function() {
  describe('resolve double negation', function() {
    const tests = [
      ['--1','1'],
      ['--x','x'],
      ['--(x + 1)', 'x + 1'],
      ['----5','--5'],
    ];

    tests.forEach(t => testSimplify(t[0], t[1], basics.RESOLVE_DOUBLE_NEGATION,
                                    ChangeTypes.RESOLVE_DOUBLE_NEGATION));
  });

  describe('rearrange coefficient', function() {
    const tests = [
      ['y^3 * 5', '5 y^3'],
      ['yz * 3', '3 yz'],
      ['3x^2 * 5', '5 (3 x^2)']
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REARRANGE_COEFF,
                                   ChangeTypes.REARRANGE_COEFF));
  });

  describe('division by negative one', function() {
    const tests = [
      ['2 / 1', '2'],
      ['x / 1', 'x'],
      ['(x + 1) / 1', 'x + 1'],
      // reverse
      ['2 / -1','-2'],
      ['x / -1','-x'],
      ['(x + 1) / -1', '-(x + 1)'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.DIVISION_BY_ONE,
                                    ChangeTypes.DIVISION_BY_ONE,
                                    basics.DIVISION_BY_NEGATIVE_ONE));
  });

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
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.MULTIPLY_BY_ZERO,
                                    ChangeTypes.MULTIPLY_BY_ZERO));
  });

  describe('reduce exponent by zero', function() {
    const tests = [
      ['2 ^ 0', '1'],
      ['x ^ 0', '1'],
      ['(x + 1) ^ 0', '1'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_EXPONENT_BY_ZERO,
                                    ChangeTypes.REMOVE_EXPONENT_BY_ZERO));
  });

  describe('reduce zero numerator', function() {
    const tests = [
      ['0 / 2', '0'],
      ['0 / x', '0'],
      ['0 / (x + 1)', '0'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_ZERO_NUMERATOR,
                                    ChangeTypes.REMOVE_ZERO_NUMERATOR));
  });


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
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_ADDING_ZERO,
                                    ChangeTypes.REMOVE_ADDING_ZERO,
                                    basics.REMOVE_ADDING_ZERO_REVERSE));
  });

  describe('remove exponent by one', function() {
    const tests = [
      ['2 ^ 1', '2'],
      ['x ^ 1', 'x'],
      ['(x + 1) ^ 1', 'x + 1'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_EXPONENT_BY_ONE,
                                    ChangeTypes.REMOVE_EXPONENT_BY_ONE));
  });

  describe('remove exponent by base one', function() {
    const tests = [
      ['1 ^ 2', '1'],
      ['1 ^ x', '1'],
      ['1 ^ (x + 1)', '1'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_EXPONENT_BASE_ONE,
                                    ChangeTypes.REMOVE_EXPONENT_BASE_ONE));
  });

  describe('remove multiplying by negative one', function() {
    const tests = [
      ['2 * -1', '-2'],
      ['x * -1', '-x'],
      ['(x + 1) * -1', '-(x + 1)'],
      ['2x * 2 * -1', '2 x * -2'],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE,
                                    ChangeTypes.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE,
                                    basics.REMOVE_MULTIPLYING_BY_NEGATIVE_ONE_REVERSE));
  });

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
    ];
    tests.forEach(t => testSimplify(t[0], t[1], basics.REMOVE_MULTIPLYING_BY_ONE,
                                    ChangeTypes.REMOVE_MULTIPLYING_BY_ONE,
                                    basics.REMOVE_MULTIPLYING_BY_ONE_REVERSE));
  });
});

function testSimplify(exprStr, outputStr, simplifyOperation, changeType, reverse) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = parse(exprStr);
    const newNode = basics.applyRule(inputNode, simplifyOperation, changeType, reverse).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

module.exports = testSimplify;
