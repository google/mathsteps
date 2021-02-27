import * as math from "mathjs";

import { flattenOperands } from "../lib/util/flattenOperands";
import { printAscii } from "../lib/util/print";
import assert = require("assert");

// TestUtil contains helper methods to share code across tests
export class TestUtil {
  // Takes in an input string and returns a flattened and parsed node
  static parseAndFlatten(exprString) {
    return flattenOperands(math.parse(exprString));
  }

  // Tests a function that takes an input string and check its output
  static testFunctionOutput(fn, input, output) {
    it(input + " -> " + output, () => {
      assert.deepEqual(fn(input), output);
    });
  }

  // tests a function that takes in a node and returns a boolean value
  static testBooleanFunction(simplifier, exprString, expectedBooleanValue) {
    it(exprString + " " + expectedBooleanValue, () => {
      const inputNode = flattenOperands(math.parse(exprString));
      assert.equal(simplifier(inputNode), expectedBooleanValue);
    });
  }

  // Tests a simplification function
  static testSimplification(
    simplifyingFunction,
    exprString,
    expectedOutputString
  ) {
    it(exprString + " -> " + expectedOutputString, () => {
      assert.deepEqual(
        printAscii(
          simplifyingFunction(flattenOperands(math.parse(exprString))).newNode
        ),
        expectedOutputString
      );
    });
  }

  // Test the substeps in the expression
  static testSubsteps(fn, exprString, outputList, outputStr) {
    it(exprString + " -> " + outputStr, () => {
      const status = fn(flattenOperands(math.parse(exprString)));
      const substeps = status.substeps;

      assert.deepEqual(substeps.length, outputList.length);
      substeps.forEach((step, i) => {
        assert.deepEqual(printAscii(step.newNode), outputList[i]);
      });
      if (outputStr) {
        assert.deepEqual(printAscii(status.newNode), outputStr);
      }
    });
  }

  // Remove some property used in mathjs that we don't need and prevents node
  // equality from passing
  static removeComments(node) {
    node
      .filter((node) => node.comment !== undefined)
      .forEach((node) => delete node.comment);
  }
}
