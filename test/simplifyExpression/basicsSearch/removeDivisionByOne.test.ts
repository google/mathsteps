import removeDivisionByOne = require("../../../lib/simplifyExpression/basicsSearch/removeDivisionByOne");
import testSimplify = require("./testSimplify");
describe("removeDivisionByOne", () => {
    testSimplify("x/1", "x", removeDivisionByOne);
});
