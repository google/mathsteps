import { removeDivisionByOne } from "../../../lib/simplifyExpression/basicsSearch/removeDivisionByOne";

import { testSimplify } from "./testSimplify";

describe("removeDivisionByOne", function () {
  testSimplify("x/1", "x", removeDivisionByOne);
});
