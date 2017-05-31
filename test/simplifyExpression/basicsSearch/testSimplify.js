const assert = require('assert');

const flatten = require('../../../lib/util/flattenOperands');
const parse = require('../../../lib/util/parse');
const print = require('../../../lib/util/print');

function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(parse(exprStr));
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

module.exports = testSimplify;
