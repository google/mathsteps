import { TestUtil } from "../TestUtil";
import { isQuadratic } from "../../lib/src/checks/isQuadratic";

function testIsQuadratic(input, output) {
  TestUtil.testBooleanFunction(isQuadratic, input, output);
}

describe("isQuadratic", function () {
  const tests = [
    ["2 + 2", false],
    ["x", false],
    ["x^2 - 4", true],
    ["x^2 + 2x + 1", true],
    ["x^2 - 2x + 1", true],
    ["x^2 + 3x + 2", true],
    ["x^2 - 3x + 2", true],
    ["x^2 + x - 2", true],
    ["x^2 + x", true],
    ["x^2 + 4", true],
    ["x^2 + 4x + 1", true],
    ["x^2", false],
    ["x^3 + x^2 + x + 1", false],
    ["x^2 + 4 + 2^x", false],
    ["x^2 + 4 + 2y", false],
    ["y^2 + 4 + 2x", false],
  ];
  tests.forEach((t) => testIsQuadratic(t[0], t[1]));
});
