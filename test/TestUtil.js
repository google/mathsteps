'use strict';
const assert = require('assert');
const print = require('../lib/util/print');
const flatten = require('../lib/util/flattenOperands');
const math = require('mathjs');

// Test helper contains methods for reducing the redundant code. (Test Util)
const TestUtil = {};

// Test the distribute steps in the expression string.
TestUtil.testDistributeSteps = function (evaluator, exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  it(exprString + ' -> ' + lastString, () => {
    const status = evaluator(flatten(math.parse(exprString)));
    const substeps = status.substeps;

    assert.deepEqual(substeps.length, outputList.length);
    substeps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });

    assert.deepEqual(
      print(status.newNode),
      lastString);
  });
};

// Test the prime factors and the factor pairs
TestUtil.testFactors = function (fn, input, output) {
  it(input + ' -> ' + output,  () => {
    assert.deepEqual(fn(input),output);
  });
};

// Testing the expression whether a true / false
TestUtil.testBooleanFunction = function (simplifier, exprStr, canCombine) {
  it(exprStr + ' ' + canCombine, () => {
    const inputNode = flatten(math.parse(exprStr));
    assert.equal(simplifier(inputNode),canCombine);
  });
};

// Test simplifier
TestUtil.testSimplification = function (evaluator, original, expected, debug) {
  (debug === undefined) ?
    (() => {
      it (original + ' -> ' + expected,  () => {
        assert.deepEqual(
          print(evaluator(flatten(math.parse(original))).newNode),expected);
      });
    })() :
    (() => {
      it(original + ' -> ' + expected,  () => {
        assert.deepEqual(
          print(evaluator(math.parse(original), debug)),
         expected);
      });
    })();
};

// Test the substeps in the expression
TestUtil.testSubsteps = function (fn, exprString, outputList, outputStr) {
  it(exprString + ' -> ' + outputStr, () => {
    const status = fn(flatten(math.parse(exprString)));
    const substeps = status.substeps;

    assert.deepEqual(substeps.length, outputList.length);
    substeps.forEach((step, i) => {
      assert.deepEqual(
        print(step.newNode),
        outputList[i]);
    });
    if (outputStr) {
      assert.deepEqual(
        print(status.newNode),
        outputStr);
    }
  });
};

module.exports = TestUtil;
