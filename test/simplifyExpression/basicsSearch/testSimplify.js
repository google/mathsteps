'use strict';

const assert = require('assert');
const math = require('mathjs');

const flatten = require('../../../lib/util/flattenOperands');
const print = require('../../../lib/util/print');


function testSimplify(exprStr, outputStr, simplifyOperation) {
  it(exprStr + ' -> ' + outputStr, function () {
    const inputNode = flatten(math.parse(exprStr));
    const newNode = simplifyOperation(inputNode).newNode;
    assert.equal(
      print(newNode),
      outputStr);
  });
}

module.exports = testSimplify;
