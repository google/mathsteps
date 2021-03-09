import { absoluteValue } from "../../../lib/src/simplifyExpression/functionsSearch/absoluteValue";

import { TestUtil } from "../../TestUtil";

function testAbsoluteValue(exprString, outputStr) {
  TestUtil.testSimplification(absoluteValue, exprString, outputStr);
}

describe("abs", function () {
  const tests = [
    ["abs(4)", "4"],
    ["abs(-5)", "5"],
  ];
  tests.forEach((t) => testAbsoluteValue(t[0], t[1]));
});
