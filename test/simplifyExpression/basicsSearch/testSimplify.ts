const assert = require("assert");
import math = require("mathjs");
import flatten = require("../../../lib/util/flattenOperands");
import print = require("../../../lib/util/print");

function testSimplify(exprStr: any, outputStr: any, simplifyOperation: any);
function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + " -> " + outputStr, () => {
      const inputNode = flatten(math.parse(exprStr));
      const newNode = simplifyOperation(inputNode).newNode;
      assert.equal(
          print(newNode),
          outputStr);
  });
}

export = testSimplify;
