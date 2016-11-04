'use strict';

const assert = require('assert');
const math = require('../../../index');

const flatten = require('../../../lib/expression/step-solver/flattenOperands.js');
const PolynomialTermNode = require('../../../lib/expression/step-solver/PolynomialTermNode.js');
const Negative = require('../../../lib/expression/step-solver/Negative.js');

function negate(exprString) {
  return Negative.negate(flatten(math.parse(exprString)));
}

describe('negatePolynomialTerm', function() {
  it('1 -> -1', function () {
    assert.deepEqual(
      negate('1'),
      flatten(math.parse('-1')));
  });
  it('-1 -> 1', function () {
    assert.deepEqual(
      negate('-1'),
      flatten(math.parse('1')));
  });
  it('1/2 -> -1/2', function () {
    assert.deepEqual(
      negate('1/2'),
      flatten(math.parse('-1/2')));
  });
  it('(x+2) -> -(x+2)', function () {
    assert.deepEqual(
      negate('(x+2)'),
      flatten(math.parse('-(x+2)')));
  });
  it('x -> -x', function () {
    assert.deepEqual(
      negate('x'),
      flatten(math.parse('-x')));
  });
  it('x^2 -> -x^2', function () {
    assert.deepEqual(
      negate('x^2'),
      flatten(math.parse('-x^2')));
  });
  it('-y^3 -> y^3', function () {
    assert.deepEqual(
      negate('-y^3'),
      flatten(math.parse('y^3')));
  });
  it('2/3 x -> -2/3 x', function () {
    assert.deepEqual(
      negate('2/3 x'),
      flatten(math.parse('-2/3 x')));
  });
  it('-5/6 z -> 5/6 x', function () {
    assert.deepEqual(
      negate('-5/6 z'),
      flatten(math.parse('5/6 z')));
  });
});
