import { printAscii } from "../lib/src/util/print";

import { Negative } from "../lib/src/Negative";

import { TestUtil } from "./TestUtil";

function testNegate(exprString, outputStr) {
  const inputStr = Negative.negate(TestUtil.parseAndFlatten(exprString));
  TestUtil.testFunctionOutput(printAscii, inputStr, outputStr);
}

describe("negate", function () {
  const tests = [
    ["1", "-1"],
    ["-1", "1"],
    ["1/2", "-1/2"],
    ["(x+2)", "-(x + 2)"],
    ["x", "-x"],
    ["x^2", "-x^2"],
    ["-y^3", "y^3"],
    ["2/3 x", "-2/3 x"],
    ["-5/6 z", "5/6 z"],
  ];
  tests.forEach((t) => testNegate(t[0], t[1]));
});
