import { reduceExponentByZero } from "../../../lib/simplifyExpression/basicsSearch/reduceExponentByZero";

import { testSimplify } from "./testSimplify";

describe("reduceExponentByZero", function () {
  testSimplify("(x+3)^0", "1", reduceExponentByZero);
});
