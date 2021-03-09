import assert = require("assert");
import { printAscii } from "../../../lib/src/util/print";
import { TestUtil } from "../../TestUtil";

export function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + " -> " + outputStr, function () {
    const inputNode = TestUtil.parseAndFlatten(exprStr);
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(printAscii(newNode), outputStr);
  });
}
