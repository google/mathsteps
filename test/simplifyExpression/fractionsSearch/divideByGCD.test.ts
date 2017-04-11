import divideByGCD = require("../../../lib/simplifyExpression/fractionsSearch/divideByGCD");
import TestUtil = require("../../TestUtil");

function testdivideByGcd(exprStr: any, outputStr: any);
function testdivideByGcd(exprStr, outputStr) {
  TestUtil.testSimplification(divideByGCD, exprStr, outputStr);
}

describe("simplifyFraction", () => {
    const tests = [
        ["2/4", "1/2"],
        ["9/3", "3"],
        ["12/27", "4/9"],
        ["1/-3", "-1/3"],
        ["-3/-2", "3/2"],
        ["-1/-1", "1"],
    ];
    tests.forEach(t => testdivideByGcd(t[0], t[1]));
});
