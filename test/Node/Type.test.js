const assert = require('assert');
const math = require('mathjs');

const Negative = require('../../lib/Negative');
const Node = require('../../lib/node');
const TestUtil = require('../TestUtil');

const constNode = Node.Creator.constant;

describe('Node.Type works', function () {
  it('(2+2) parenthesis', function () {
    assert.deepEqual(
      Node.Type.isParenthesis(math.parse('(2+2)')),
      true);
  });
  it('10 constant', function () {
    assert.deepEqual(
      Node.Type.isConstant(math.parse(10)),
      true);
  });
  it('-2 constant', function () {
    assert.deepEqual(
      Node.Type.isConstant(constNode(-2)),
      true);
  });
  it('2+2 operator without operator param', function () {
    assert.deepEqual(
      Node.Type.isOperator(math.parse('2+2')),
      true);
  });
  it('2+2 operator with correct operator param', function () {
    assert.deepEqual(
      Node.Type.isOperator(math.parse('2+2'), '+'),
      true);
  });
  it('2+2 operator with incorrect operator param', function () {
    assert.deepEqual(
      Node.Type.isOperator(math.parse('2+2'), '-'),
      false);
  });
  it('-x not operator', function () {
    assert.deepEqual(
      Node.Type.isOperator(math.parse('-x')),
      false);
  });
  it('-x not symbol', function () {
    assert.deepEqual(
      Node.Type.isSymbol(math.parse('-x')),
      false);
  });
  it('y symbol', function () {
    assert.deepEqual(
      Node.Type.isSymbol(math.parse('y')),
      true);
  });
  it('abs(5) is abs function', function () {
    assert.deepEqual(
      Node.Type.isFunction(math.parse('abs(5)'), 'abs'),
      true);
  });
  it('sqrt(5) is not abs function', function () {
    assert.deepEqual(
      Node.Type.isFunction(math.parse('sqrt(5)'), 'abs'),
      false);
  });
  // it('nthRoot(4) is an nthRoot function', function () {
  //   assert.deepEqual(
  //     Node.Type.isFunction(math.parse('nthRoot(5)'), 'nthRoot'),
  //     true);
  // });
});

describe('isConstantOrConstantFraction', function () {
  it('2 true', function () {
    assert.deepEqual(
      Node.Type.isConstantOrConstantFraction(math.parse('2')),
      true);
  });
  it('2/9 true', function () {
    assert.deepEqual(
      Node.Type.isConstantOrConstantFraction(math.parse('4/9')),
      true);
  });
  it('x/2 false', function () {
    assert.deepEqual(
      Node.Type.isConstantOrConstantFraction(math.parse('x/2')),
      false);
  });
});

describe('isIntegerFraction', function () {
  it('4/5 true', function () {
    assert.deepEqual(
      Node.Type.isIntegerFraction(math.parse('4/5')),
      true);
  });
  it('4.3/5 false', function () {
    assert.deepEqual(
      Node.Type.isIntegerFraction(math.parse('4.3/5')),
      false);
  });
  it('4x/5 false', function () {
    assert.deepEqual(
      Node.Type.isIntegerFraction(math.parse('4x/5')),
      false);
  });
  it('5 false', function () {
    assert.deepEqual(
      Node.Type.isIntegerFraction(math.parse('5')),
      false);
  });
});

describe('isFraction', function () {
  it('2/3 true', function () {
    assert.deepEqual(
      Node.CustomType.isFraction(math.parse('2/3')),
      true);
  });
  it('-2/3 true', function () {
    assert.deepEqual(
      Node.CustomType.isFraction(math.parse('-2/3')),
      true);
  });
  it('-(2/3) true', function () {
    assert.deepEqual(
      Node.CustomType.isFraction(math.parse('-(2/3)')),
      true);
  });
  it('(2/3) true', function () {
    assert.deepEqual(
      Node.CustomType.isFraction(math.parse('(2/3)')),
      true);
  });
});

describe('getFraction', function () {
  it('2/3 2/3', function () {
    assert.deepEqual(
      Node.CustomType.getFraction(math.parse('2/3')),
      math.parse('2/3'));
  });

  const expectedFraction = math.parse('2/3');
  TestUtil.removeComments(expectedFraction);

  it('(2/3) 2/3', function () {
    assert.deepEqual(
      Node.CustomType.getFraction(math.parse('(2/3)')),
      expectedFraction);
  });

  // we can't just parse -2/3 to get the expected fraction,
  // because that will put a unary minus on the 2,
  // instead of using a constant node of value -2 as our code does
  const negativeExpectedFraction = math.parse('2/3');
  TestUtil.removeComments(negativeExpectedFraction);
  Negative.negate(negativeExpectedFraction);

  it('-(2/3) -2/3', function () {
    assert.deepEqual(
      Node.CustomType.getFraction(math.parse('-(2/3)')),
      negativeExpectedFraction);
  });
});
