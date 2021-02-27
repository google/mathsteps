import { reduceMultiplicationByZero } from "../../../lib/simplifyExpression/basicsSearch/reduceMultiplicationByZero";

import { testSimplify } from "./testSimplify";

describe("reduce multiplication by 0", function () {
  const tests = [
    ["0x", "0"],
    ["2*0*z^2", "0"],
  ];
  tests.forEach((t) => testSimplify(t[0], t[1], reduceMultiplicationByZero));
});
