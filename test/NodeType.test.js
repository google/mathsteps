'use strict';

const assert = require('assert');
const math = require('../../../index');

const NodeType = require('../../../lib/expression/step-solver/NodeType.js');
const NodeCreator = require('../../../lib/expression/step-solver/NodeCreator.js');
let constNode = NodeCreator.constant;

describe('NodeType works', function () {
  it('(2+2) parenthesis', function () {
    assert.deepEqual(
      NodeType.isParenthesis(math.parse('(2+2)')),
      true);
  });
  it('10 constant', function () {
    assert.deepEqual(
      NodeType.isConstant(math.parse(10)),
      true);
  });
  it('-2 constant', function () {
    assert.deepEqual(
      NodeType.isConstant(constNode(-2)),
      true);
  });
  it('2+2 operator', function () {
    assert.deepEqual(
      NodeType.isOperator(math.parse('2+2')),
      true);
  });
  it('-x not operator', function () {
    assert.deepEqual(
      NodeType.isOperator(math.parse('-x')),
      false);
  });
  it('-x symbol', function () {
    assert.deepEqual(
      NodeType.isSymbol(math.parse('-x')),
      true);
  });
  it('y symbol', function () {
    assert.deepEqual(
      NodeType.isSymbol(math.parse('y')),
      true);
  });
  it('abs(5) is abs function', function () {
    assert.deepEqual(
      NodeType.isFunction(math.parse('abs(5)'), 'abs'),
      true);
  });
  it('sqrt(5) is not abs function', function () {
    assert.deepEqual(
      NodeType.isFunction(math.parse('sqrt(5)'), 'abs'),
      false);
  });
});

describe('isConstantOrConstantFraction', function () {
  it('2 true', function () {
    assert.deepEqual(
      NodeType.isConstantOrConstantFraction(math.parse('2')),
      true);
  });
  it('2/9 true', function () {
    assert.deepEqual(
      NodeType.isConstantOrConstantFraction(math.parse('4/9')),
      true);
  });
  it('x/2 false', function () {
    assert.deepEqual(
      NodeType.isConstantOrConstantFraction(math.parse('x/2')),
      false);
  });
});

describe('isIntegerFraction', function () {
  it('4/5 true', function () {
    assert.deepEqual(
      NodeType.isIntegerFraction(math.parse('4/5')),
      true);
  });
  it('4.3/5 false', function () {
    assert.deepEqual(
      NodeType.isIntegerFraction(math.parse('4.3/5')),
      false);
  });
  it('4x/5 false', function () {
    assert.deepEqual(
      NodeType.isIntegerFraction(math.parse('4x/5')),
      false);
  });
  it('5 false', function () {
    assert.deepEqual(
      NodeType.isIntegerFraction(math.parse('5')),
      false);
  });
});
