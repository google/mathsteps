import { removeAdditionOfZero } from "../../../lib/simplifyExpression/basicsSearch/removeAdditionOfZero";

import { testSimplify } from "./testSimplify";

describe("removeAdditionOfZero", function () {
  var tests = [
    ["2+0+x", "2 + x"],
    ["2+x+0", "2 + x"],
    ["0+2+x", "2 + x"],
  ];
  tests.forEach((t) => testSimplify(t[0], t[1], removeAdditionOfZero));
});
