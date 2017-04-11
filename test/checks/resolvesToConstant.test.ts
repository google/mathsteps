import checks = require("../../lib/checks");
import TestUtil = require("../TestUtil");

function testResolvesToConstant(exprString: any, resolves: any);
function testResolvesToConstant(exprString, resolves) {
  TestUtil.testBooleanFunction(checks.resolvesToConstant, exprString, resolves);
}

describe("resolvesToConstant", () => {
    const tests = [
        ["(2+2)", true],
        ["10", true],
        ["((2^2 + 4)) * 7 / 8", true],
        ["2 * 3^x", false],
        ["-(2) * -3", true],
    ];
    tests.forEach(t => testResolvesToConstant(t[0], t[1]));
});
