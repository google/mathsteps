const assert = require('assert');

const print = require('../../../lib/util/print');

const TestUtil = require('../../TestUtil');

function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = TestUtil.parseAndFlatten(exprStr);
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(
      print.ascii(newNode),
      outputStr);
  });
}

module.exports = testSimplify;
