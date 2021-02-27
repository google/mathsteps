import { removeExponentByOne } from "../../../lib/simplifyExpression/basicsSearch/removeExponentByOne";

import { testSimplify } from "./testSimplify";

describe("removeExponentByOne", function () {
  testSimplify("x^1", "x", removeExponentByOne);
});
