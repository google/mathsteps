import rearrangeCoefficient = require("../../../lib/simplifyExpression/basicsSearch/rearrangeCoefficient");
import testSimplify = require("./testSimplify");
describe("rearrangeCoefficient", () => {
    const tests = [
        ["2 * x^2", "2x^2"],
        ["y^3 * 5", "5y^3"],
    ];
    tests.forEach(t => testSimplify(t[0], t[1], rearrangeCoefficient));
});
