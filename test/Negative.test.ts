import math = require("mathjs");
import flatten = require("../lib/util/flattenOperands");
import print = require("../lib/util/print");
import Negative = require("../lib/Negative");
import TestUtil = require("./TestUtil");

function testNegate(exprString: any, outputStr: any);
function testNegate(exprString, outputStr) {
  const inputStr = Negative.negate(flatten(math.parse(exprString)));
  TestUtil.testFunctionOutput(print, inputStr, outputStr);
}

describe("negate", () => {
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
    tests.forEach(t => testNegate(t[0], t[1]));
});
