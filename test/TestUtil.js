const assert = require('assert');
const {parse} = require('math-parser');

const flatten = require('../lib/util/flattenOperands');
const print = require('../lib/util/print');

// TestUtil contains helper methods to share code across tests
const TestUtil = {};

// Takes in an input string and returns a flattened and parsed node
TestUtil.parseAndFlatten = function (exprString) {
  return flatten(parse(exprString));
};

// Tests a function that takes an input string and check its output
TestUtil.testFunctionOutput = function (fn, input, output) {
  it(print.ascii(input) + ' -> ' + output,  () => {
    assert.deepEqual(fn(input),output);
  });
};

// tests a function that takes in a node and returns a boolean value
TestUtil.testBooleanFunction = function (simplifier, exprString, expectedBooleanValue) {
  it(exprString + ' ' + expectedBooleanValue, () => {
    const inputNode = flatten(parse(exprString));
    assert.equal(simplifier(inputNode),expectedBooleanValue);
  });
};

// Tests a simplification function
TestUtil.testSimplification = function (simplifyingFunction, exprString,
                                        expectedOutputString) {
  it (exprString + ' -> ' + expectedOutputString,  () => {
    assert.deepEqual(
      print.ascii(simplifyingFunction(flatten(parse(exprString))).newNode),
      expectedOutputString);
  });
};

// Test the substeps in the expression
TestUtil.testSubsteps = function (fn, exprString, outputList,
                                    outputStr) {
  it(exprString + ' -> ' + outputStr, () => {
    const status = fn(flatten(parse(exprString)));
    const substeps = status.substeps;

    assert.deepEqual(substeps.length, outputList.length);
    substeps.forEach((step, i) => {
      assert.deepEqual(
        print.ascii(step.newNode),
        outputList[i]);
    });
    if (outputStr) {
      assert.deepEqual(
        print.ascii(status.newNode),
        outputStr);
    }
  });
};

module.exports = TestUtil;
