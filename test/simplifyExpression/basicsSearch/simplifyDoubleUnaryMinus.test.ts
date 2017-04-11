import simplifyDoubleUnaryMinus = require("../../../lib/simplifyExpression/basicsSearch/simplifyDoubleUnaryMinus");
import testSimplify = require("./testSimplify");
describe("simplifyDoubleUnaryMinus", () => {
    var tests = [
        ["--5", "5"],
        ["--x", "x"]
    ];
    tests.forEach(t => testSimplify(t[0], t[1], simplifyDoubleUnaryMinus));
});
