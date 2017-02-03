const assert = require('assert');
const math = require('mathjs');

const flatten = require('../lib/util/flattenOperands');
const print = require('../lib/util/print');

// TestUtil contains helper methods to share code across tests
const TestUtil = {};

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
TestUtil.testSimplification = function (simplifyingFunction, exprString, expectedOutputString) {
  it (exprString + ' -> ' + expectedOutputString,  () => {
    assert.deepEqual(
      print(simplifyingFunction(flatten(math.parse(exprString))).newNode),expectedOutputString);
  });
};

// Test the substeps in the expression
TestUtil.testSubsteps = function (collectAndCombineSearch, exprString, outputList, outputStr) {
  it(exprString + ' -> ' + outputStr, () => {
    const status = collectAndCombineSearch(flatten(math.parse(exprString)));
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
