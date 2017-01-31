'use strict';
const assert = require('assert');
const math = require('mathjs');

const print = require('../lib/util/print');
const flatten = require('../lib/util/flattenOperands');

// TestUtil contains helper methods to share code across tests
const TestUtil = {};

// Test the distribute steps in the expression string.
TestUtil.verifyDistributeSteps = function (evaluator, exprString, outputList) {
  const lastString = outputList[outputList.length - 1];
  TestUtil.testSubsteps(evaluator, exprString, outputList, lastString);
};

// Test the prime factors and the factor pairs
TestUtil.testFunctionOutput = function (fn, input, output) {
  it(input + ' -> ' + output,  () => {
    assert.deepEqual(fn(input),output);
  });
};

// Testing the expression whether a true / false
TestUtil.testBooleanFunction = function (simplifier, exprString, expectedBooleanValue) {
  it(exprString + ' ' + expectedBooleanValue, () => {
    const inputNode = flatten(math.parse(exprString));
    assert.equal(simplifier(inputNode),expectedBooleanValue);
  });
};

// Tests a simplification function
TestUtil.testSimplification = function (simplifyingFunction, exprString, expectedOutputString, debug) {
  (debug === undefined) ?
    (() => {
      it (exprString + ' -> ' + expectedOutputString,  () => {
        assert.deepEqual(
          print(simplifyingFunction(flatten(math.parse(exprString))).newNode),expectedOutputString);
      });
    })() :
    (() => {
      it(exprString + ' -> ' + expectedOutputString,  () => {
        assert.deepEqual(
          print(simplifyingFunction(math.parse(exprString), debug)),
         expectedOutputString);
      });
    })();
};

// Tests a simplification function, as well as the substeps it generates
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
    outputStr ? assert.deepEqual(
      print(status.newNode),
      outputStr) : null
  });
};

module.exports = TestUtil;
