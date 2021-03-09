import { TestUtil } from "../TestUtil";
import { resolvesToConstant } from "../../lib/src/checks/resolvesToConstant";

function testResolvesToConstant(exprString, resolves) {
  TestUtil.testBooleanFunction(resolvesToConstant, exprString, resolves);
}

describe("resolvesToConstant", function () {
  const tests = [
    ["(2+2)", true],
    ["10", true],
    ["((2^2 + 4)) * 7 / 8", true],
    ["2 * 3^x", false],
    ["-(2) * -3", true],
  ];
  tests.forEach((t) => testResolvesToConstant(t[0], t[1]));
});
