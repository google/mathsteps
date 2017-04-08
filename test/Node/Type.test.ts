const assert = require('assert');
import math = require('mathjs');
const mathNode = require('../../lib/node');

const constNode = mathNode.Creator.constant;

describe('mathNode.Type works', () => {
    it('(2+2) parenthesis', () => {
        assert.deepEqual(
            mathNode.Type.isParenthesis(math.parse('(2+2)')),
            true);
    });
    it('10 constant', () => {
        assert.deepEqual(
            mathNode.Type.isConstant(math.parse(10)),
            true);
    });
    it('-2 constant', () => {
        assert.deepEqual(
            mathNode.Type.isConstant(constNode(-2)),
            true);
    });
    it('2+2 operator without operator param', () => {
        assert.deepEqual(
            mathNode.Type.isOperator(math.parse('2+2')),
            true);
    });
    it('2+2 operator with correct operator param', () => {
        assert.deepEqual(
            mathNode.Type.isOperator(math.parse('2+2'), '+'),
            true);
    });
    it('2+2 operator with incorrect operator param', () => {
        assert.deepEqual(
            mathNode.Type.isOperator(math.parse('2+2'), '-'),
            false);
    });
    it('-x not operator', () => {
        assert.deepEqual(
            mathNode.Type.isOperator(math.parse('-x')),
            false);
    });
    it('-x symbol', () => {
        assert.deepEqual(
            mathNode.Type.isSymbol(math.parse('-x')),
            true);
    });
    it('y symbol', () => {
        assert.deepEqual(
            mathNode.Type.isSymbol(math.parse('y')),
            true);
    });
    it('abs(5) is abs function', () => {
        assert.deepEqual(
            mathNode.Type.isFunction(math.parse('abs(5)'), 'abs'),
            true);
    });
    it('sqrt(5) is not abs function', () => {
        assert.deepEqual(
            mathNode.Type.isFunction(math.parse('sqrt(5)'), 'abs'),
            false);
    });
    // it('nthRoot(4) is an nthRoot function', function () {
    //   assert.deepEqual(
    //     mathNode.Type.isFunction(math.parse('nthRoot(5)'), 'nthRoot'),
    //     true);
    // });
});

describe('isConstantOrConstantFraction', () => {
    it('2 true', () => {
        assert.deepEqual(
            mathNode.Type.isConstantOrConstantFraction(math.parse('2')),
            true);
    });
    it('2/9 true', () => {
        assert.deepEqual(
            mathNode.Type.isConstantOrConstantFraction(math.parse('4/9')),
            true);
    });
    it('x/2 false', () => {
        assert.deepEqual(
            mathNode.Type.isConstantOrConstantFraction(math.parse('x/2')),
            false);
    });
});

describe('isIntegerFraction', () => {
    it('4/5 true', () => {
        assert.deepEqual(
            mathNode.Type.isIntegerFraction(math.parse('4/5')),
            true);
    });
    it('4.3/5 false', () => {
        assert.deepEqual(
            mathNode.Type.isIntegerFraction(math.parse('4.3/5')),
            false);
    });
    it('4x/5 false', () => {
        assert.deepEqual(
            mathNode.Type.isIntegerFraction(math.parse('4x/5')),
            false);
    });
    it('5 false', () => {
        assert.deepEqual(
            mathNode.Type.isIntegerFraction(math.parse('5')),
            false);
    });
});
