const assert = require('assert');
import math = require('mathjs');
import flatten = require('../lib/util/flattenOperands');
import print = require('../lib/util/print');

// TestUtil contains helper methods to share code across tests
const TestUtil = {};

// Tests a function that takes an input string and check its output
TestUtil.testFunctionOutput = (fn, input, output) => {
    it(input + ' -> ' + output,  () => {
        assert.deepEqual(fn(input),output);
    });
};

// tests a function that takes in a node and returns a boolean value
TestUtil.testBooleanFunction = (simplifier, exprString, expectedBooleanValue) => {
    it(exprString + ' ' + expectedBooleanValue, () => {
        const inputNode = flatten(math.parse(exprString));
        assert.equal(simplifier(inputNode),expectedBooleanValue);
    });
};

// Tests a simplification function
TestUtil.testSimplification = (simplifyingFunction, exprString, expectedOutputString) => {
    it (exprString + ' -> ' + expectedOutputString,  () => {
        assert.deepEqual(
            print(simplifyingFunction(flatten(math.parse(exprString))).newNode),
            expectedOutputString);
    });
};

// Test the substeps in the expression
TestUtil.testSubsteps = (fn, exprString, outputList, outputStr) => {
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
export = TestUtil;
